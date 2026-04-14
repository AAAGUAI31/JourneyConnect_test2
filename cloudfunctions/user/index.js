// cloud/functions/user/index.js
// 依赖集合：email_domain_whitelist { domain }，email_verifications { openid, email, codeHash, expireAt, createdAt }
const cloud = require('wx-server-sdk')
const crypto = require('crypto')
const nodemailer = require('nodemailer')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

const CODE_TTL_MS = 10 * 60 * 1000
const RESEND_INTERVAL_MS = 60 * 1000

function hashCode(openid, email, code) {
  const salt = process.env.EMAIL_CODE_SALT || 'journeyconnect-email-salt'
  return crypto
    .createHash('sha256')
    .update(`${salt}|${openid}|${email}|${code}`)
    .digest('hex')
}

function parseSchoolEmail(raw) {
  const email = String(raw || '')
    .trim()
    .toLowerCase()
  if (!email || !email.includes('@')) {
    return { error: '请输入有效的邮箱地址' }
  }
  const parts = email.split('@')
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { error: '请输入有效的邮箱地址' }
  }
  const domain = parts[1]
  return { email, domain }
}

// 直接通过正则匹配的教育域名后缀
const EDU_REGEX = /\.(edu\.cn|edu)$/i

async function isDomainAllowed(domain) {
  // 优先用正则匹配 .edu.cn 或 .edu 结尾
  if (EDU_REGEX.test(domain)) {
    return true
  }
  // 不符合正则时再查白名单
  const res = await db
    .collection('email_domain_whitelist')
    .where({ domain })
    .count()
  return res.total > 0
}

function createMailTransport() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 465)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) {
    return null
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  })
}

async function sendVerificationEmail(to, code) {
  const transport = createMailTransport()
  if (!transport) {
    throw new Error('邮件服务未配置，请联系管理员配置 SMTP 环境变量')
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER
  await transport.sendMail({
    from,
    to,
    subject: '【JourneyConnect】邮箱验证码',
    text: `您的验证码是：${code}，10 分钟内有效。如非本人操作请忽略。`,
    html: `<p>您的验证码是：<strong>${code}</strong></p><p>10 分钟内有效。如非本人操作请忽略。</p>`
  })
}

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const { action, userData } = event

    const userResult = await db.collection('users').where({
      openid: openid
    }).get()

    if (userResult.data.length === 0) {
      return {
        success: false,
        error: '用户不存在，请先登录'
      }
    }

    const userId = userResult.data[0]._id
    const userDoc = userResult.data[0]

    switch (action) {
      case 'sendEmailCode': {
        const { email: rawEmail } = event
        if (userDoc.emailVerified) {
          return { success: false, error: '邮箱已验证，无需重复认证' }
        }
        const parsed = parseSchoolEmail(rawEmail)
        if (parsed.error) {
          return { success: false, error: parsed.error }
        }
        const { email, domain } = parsed
        const ok = await isDomainAllowed(domain)
        if (!ok) {
          return { success: false, error: '请使用学校邮箱（域名须以 .edu.cn 或 .edu 结尾）' }
        }

        const existing = await db
          .collection('email_verifications')
          .where({ openid })
          .get()

        const now = Date.now()
        if (existing.data.length > 0) {
          const row = existing.data[0]
          const created = row.createdAt ? new Date(row.createdAt).getTime() : 0
          if (now - created < RESEND_INTERVAL_MS) {
            return { success: false, error: '发送太频繁，请稍后再试' }
          }
        }

        const code = String(Math.floor(100000 + Math.random() * 900000))
        const codeHash = hashCode(openid, email, code)
        const expireAt = new Date(now + CODE_TTL_MS)

        if (existing.data.length > 0) {
          await db.collection('email_verifications').doc(existing.data[0]._id).update({
            data: {
              email,
              codeHash,
              expireAt,
              createdAt: db.serverDate()
            }
          })
        } else {
          await db.collection('email_verifications').add({
            data: {
              openid,
              email,
              codeHash,
              expireAt,
              createdAt: db.serverDate()
            }
          })
        }

        await sendVerificationEmail(email, code)

        return { success: true, email }
      }

      case 'verifyEmailCode': {
        const { email: rawEmail, code } = event
        if (!code || String(code).trim().length < 4) {
          return { success: false, error: '请输入验证码' }
        }
        if (userDoc.emailVerified) {
          return { success: false, error: '邮箱已验证' }
        }
        const parsed = parseSchoolEmail(rawEmail)
        if (parsed.error) {
          return { success: false, error: parsed.error }
        }
        const { email, domain } = parsed
        const ok = await isDomainAllowed(domain)
        if (!ok) {
          return { success: false, error: '请使用学校邮箱（域名须以 .edu.cn 或 .edu 结尾）' }
        }

        const verRes = await db
          .collection('email_verifications')
          .where({ openid })
          .get()

        if (verRes.data.length === 0) {
          return { success: false, error: '请先获取验证码' }
        }

        const row = verRes.data[0]
        if (row.email !== email) {
          return { success: false, error: '邮箱与发送验证码时不一致' }
        }

        const exp = row.expireAt ? new Date(row.expireAt).getTime() : 0
        if (Date.now() > exp) {
          return { success: false, error: '验证码已过期，请重新获取' }
        }

        const inputHash = hashCode(openid, email, String(code).trim())
        if (inputHash !== row.codeHash) {
          return { success: false, error: '验证码错误' }
        }

        await db.collection('users').doc(userId).update({
          data: {
            email,
            emailVerified: true,
            updateTime: db.serverDate()
          }
        })

        await db.collection('email_verifications').doc(row._id).remove()

        const updatedUser = await db.collection('users').doc(userId).get()

        return {
          success: true,
          user: updatedUser.data
        }
      }

      case 'update': {
        const updateData = {
          updateTime: db.serverDate()
        }

        if (userData && userData.name !== undefined) updateData.name = userData.name
        if (userData && userData.avatar !== undefined) updateData.avatar = userData.avatar
        if (userData && userData.wechat !== undefined) updateData.wechat = userData.wechat
        if (userData && userData.phone !== undefined) updateData.phone = userData.phone
        if (userData && userData.signature !== undefined) updateData.signature = userData.signature

        await db.collection('users').doc(userId).update({
          data: updateData
        })

        const updatedUser = await db.collection('users').doc(userId).get()

        return {
          success: true,
          user: updatedUser.data
        }
      }

      case 'getActivityMembers': {
        const { activityId } = event
        if (!activityId) {
          return { success: false, error: 'activityId 不能为空' }
        }

        const membersRes = await db.collection('activity_members')
          .where({ activityId })
          .get()

        if (membersRes.data.length === 0) {
          return { success: true, members: [], userMap: {} }
        }

        const memberUserIds = [...new Set(membersRes.data.map(m => m.userId).filter(Boolean))]
        const usersRes = await db.collection('users')
          .where({ _id: db.command.in(memberUserIds) })
          .get()

        const userMap = {}
        usersRes.data.forEach(u => {
          userMap[u._id] = {
            id: u._id,
            name: u.name || '未命名用户',
            avatar: u.avatar || ''
          }
        })

        return { success: true, members: membersRes.data, userMap }
      }

      case 'get': {
        const userInfo = await db.collection('users').doc(userId).get()

        const createdCount = await db.collection('activities').where({
          creatorId: userId
        }).count()

        const joinedCount = await db.collection('activity_members').where({
          userId: userId
        }).count()

        return {
          success: true,
          user: {
            ...userInfo.data,
            createdCount: createdCount.total,
            joinedCount: joinedCount.total
          }
        }
      }

      default:
        return {
          success: false,
          error: '不支持的操作'
        }
    }
  } catch (error) {
    console.error('用户操作失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

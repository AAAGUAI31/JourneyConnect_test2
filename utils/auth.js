/**
 * 学校邮箱是否已通过服务端验证（用于发帖、报名等）
 */
function isSchoolEmailVerified(userInfo) {
  return !!(userInfo && userInfo._id && userInfo.emailVerified === true)
}

module.exports = {
  isSchoolEmailVerified
}

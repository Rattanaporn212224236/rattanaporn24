const userRepository = require("./user.repository");
const {
  validateUser,
  validateId
} = require("./user.validation");

async function getAllUsers() {
  return userRepository.findAll();
}

async function getUserById(id) {
  const userId = validateId(id);
  const user = await userRepository.findById(userId);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return user;
}

async function createUser(userData) {
  const validData = validateUser(userData);
  const newUserId = await userRepository.create(validData);
  return getUserById(newUserId);
}

async function updateUser(id, userData) {
  const userId = validateId(id);
  // ตรวจสอบก่อนว่า User นี้มีตัวตนอยู่จริงไหม
  await getUserById(userId);

  const validData = validateUser(userData);
  await userRepository.update(userId, validData);

  return getUserById(userId);
}

async function deleteUser(id) {
  const userId = validateId(id);
  // ตรวจสอบก่อนว่า User นี้มีตัวตนอยู่จริงไหม
  await getUserById(userId);
  await userRepository.remove(userId);
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
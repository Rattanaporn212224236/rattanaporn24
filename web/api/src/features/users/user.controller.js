const userService = require("./user.service");
const { success } = require("../../utils/response");

// [READ ALL]
const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    return success(res, "ดึงข้อมูลผู้ใช้ทั้งหมดสำเร็จ", users);
  } catch (error) {
    next(error);
  }
};

// [READ ONE]
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    return success(res, "ดึงข้อมูลผู้ใช้สำเร็จ", user);
  } catch (error) {
    next(error);
  }
};

// [CREATE]
const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    return success(res, "สร้างผู้ใช้ใหม่สำเร็จ", user);
  } catch (error) {
    next(error);
  }
};

// [UPDATE]
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.updateUser(id, req.body);
    return success(res, "แก้ไขข้อมูลผู้ใช้สำเร็จ", user);
  } catch (error) {
    next(error);
  }
};

// [DELETE]
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    await userService.deleteUser(id);
    return success(res, "ลบผู้ใช้สำเร็จ");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
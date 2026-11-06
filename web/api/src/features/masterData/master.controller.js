const masterRepository = require("./master.repository");
const { success } = require("../../utils/response");

const getAllDepartments = async (req, res, next) => {
    try {
        const departments = await masterRepository.findAllDepartments();
        return success(res, "ดึงข้อมูลหน่วยงานสำเร็จ", departments);
    } catch (error) {
        next(error);
    }
};

const getAllCategories = async (req, res, next) => {
    try {
        const categories = await masterRepository.findAllCategories();
        return success(res, "ดึงข้อมูลหมวดหมู่สำเร็จ", categories);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllDepartments,
    getAllCategories
};
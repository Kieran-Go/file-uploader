const prisma = require('../db/pool');
const bcrypt = require("bcryptjs");

module.exports = {

  findUserById: async (id) => {
    return await prisma.user.findUnique({
      where: { id: id }
    });
  },

  findUserByEmail: async (email) => {
    return await prisma.user.findUnique({
      where: { email: email }
    });
  },

  createUser: async (name, email, password) => {
    const hashedPassword = await bcrypt.hash(password, 10);

    return await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword
      }
    });
  }
}
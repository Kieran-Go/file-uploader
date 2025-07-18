require("dotenv").config();
const prisma = require('../db/pool');
const bcrypt = require("bcryptjs");
const fs = require("fs/promises");

// Configure cloudinary
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
  secure: true,
});


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
  },

  getFile: async (id) => {
    return await prisma.file.findUnique({
        where: {
            id: id,
        }
    })
  },

    uploadFile: async (file, folderId) => {
        if (!file) {
            console.error("No file uploaded.");
            return;
        }

        try {
            // Upload to Cloudinary
            const result = await cloudinary.uploader.upload(file.path, {
                resource_type: "auto", // auto-detects the file type
                folder: `folder_${folderId}`, // organize by folder
                use_filename: true,
                unique_filename: false,
            });

            // Delete local file after upload
            await fs.unlink(file.path);

            // Save metadata to DB
            const newFile = await prisma.file.create({
                data: {
                    originalName: file.originalname,
                    storedName: result.public_id,
                    path: result.secure_url, // Save the URL to the db
                    size: file.size,
                    uploadedAt: new Date(),
                    folderId: folderId,
                },
            });
            return newFile;
        } catch (err) {
            console.error("Cloudinary upload failed:", err);
            throw err;
        }
    },

    deleteFile: async (id) => {
        const file = await prisma.file.findUnique({ where: { id } });
        if (!file) throw new Error("File not found");

        // Delete from Cloudinary
        await cloudinary.uploader.destroy(file.storedName);

        // Delete from DB
        await prisma.file.delete({ where: { id } });

        return file;
    },



    getAllFolders: async () => {
        return await prisma.folder.findMany();
    },

    getFolder: async (id) => {
        return await prisma.folder.findUnique({
            where: {
                id: id,
            }
        });
    },

    createFolder: async (name, userId) => {
        return await prisma.folder.create({
            data: {
                name: name,
                userId: userId,
            }
        });
    },

    getFolderFiles: async (folderId) => {
        return await prisma.file.findMany({
            where: {
                folderId: folderId
            }
        });
    },

    deleteFolder: async (id) => {
        await prisma.folder.delete({
            where: {
                id: id,
            }
        });
    },
}
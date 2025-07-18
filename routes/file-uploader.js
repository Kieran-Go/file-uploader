const { Router } = require("express");
const router = Router();
const passport = require("passport");
const controller = require("../controllers/file-uploader-Controller");
const multer = require("multer");
const upload = multer({ dest: 'uploads/'});
const fileUploaderController = require("../controllers/file-uploader-controller");

router.get("/", async (req, res) => {
    const folders = await fileUploaderController.getAllFolders();
    res.render("home", { folders });
})

// Sign up
router.get("/sign-up", (req, res) => {
    res.render("sign-up-form", { data: {} });
});

router.post("/sign-up", async (req, res, next) => {
    // Retrieve form data from body
    const { name, email, password } = req.body;
    try{
        // Create new with using form data
        const newUser = await controller.createUser(name, email, password);
        console.log(`New user ${newUser.username} successfully added.`);
         
        // Automatically log in the new user
        req.login(newUser, function(err) {
            if (err) return next(err);
            return res.redirect("/");
        });
    }
    catch(err) { return next(err) }
});

// Log in
router.get("/log-in", (req, res) => {
    res.render("log-in-form", { error: null });
});

router.post("/log-in", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);

    if (!user) {
      // Login failed — show error message
      return res.status(401).render("log-in-form", { error: info.message });
    }

    // Login succeeded
    req.login(user, (err) => {
      if (err) return next(err);
      return res.redirect("/");
    });
  })(req, res, next);
});


// Log out
router.get("/log-out", (req, res, next) => {
    req.logout(function(err) {
        if (err) return next(err);
        res.redirect("/");
    });
});

// New folder
router.post("/new-folder", async (req, res) => {
    const folderName = req.body["folder-name"];
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).send("You must be logged in to create a folder.");
    }

    try {
        const newFolder = await fileUploaderController.createFolder(folderName, userId);
        console.log(`New folder created: ${newFolder.name}`);
        res.redirect("/");
    } catch (err) {
        console.error("Error creating folder:", err);
        res.status(500).send("Failed to create folder.");
    }
});

// Delete folder
router.get("/delete-folder/:id", async (req, res) => {
    const folderId = parseInt(req.params.id);
    try {
        await fileUploaderController.deleteFolder(folderId);
        res.redirect("/");
    } catch (err) {
        console.error("Error deleting folder:", err);
        res.status(500).send("Failed to delete folder.");
    }
});

// Folder page
router.get("/folder/:id", async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).send("You must be logged in to create a folder.");
    }

    const folderId = parseInt(req.params.id);
    try {
        const folder = await fileUploaderController.getFolder(folderId);
        const files = await fileUploaderController.getFolderFiles(folderId);
        res.render("file-list", { files, folder: folder })
    }
    catch(err) {
        console.error("Error loading this folder", err);
    }
});

// File page
router.get("/file/:id", async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).send("You must be logged in to create a folder.");
    }

    const fileId = parseInt(req.params.id);
    try {
        const file = await fileUploaderController.getFile(fileId);
        res.render("file", { file });
    }
    catch(err) {
        console.error("Error loading this file", err);
    }
});

// Upload file
router.post("/upload-file/:folderId", upload.single('file'), async (req, res) => {
  const folderId = parseInt(req.params.folderId);
  try {
    await fileUploaderController.uploadFile(req.file, folderId);
    res.redirect(`/folder/${folderId}`);
  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).send("Something went wrong during file upload.");
  }
});

// Delete file
router.get("/delete-file/:id", async (req, res) => {
    const fileId = parseInt(req.params.id);
    try {
        const deletedFile = await fileUploaderController.deleteFile(fileId);
        res.redirect(`/folder/${deletedFile.folderId}`);
    } catch (err) {
        console.error("Error deleting file:", err);
        res.status(500).send("Failed to delete file.");
    }
});

module.exports = router;
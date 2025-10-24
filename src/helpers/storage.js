const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  SUPPORTED_FORMATS_IMAGE,
  SUPPORTED_FORMATS_DOC,
  FILE_SIZE_video,
} = require("./formValidConfig");

exports.uploadTo = class {
  constructor({
    dir = "admins",
    isImage = false,
    isDoc = false,
    isVideo = false,
    fileSize = 2,       
  }) {
    const maxAllowSize = fileSize * Math.pow(1024, 50);

    const fileFilter = (req, file, cb) => {
      // Check uploaded file not exceed permitted size.
      const reqSize = parseInt(req.headers["content-length"]);
      if (reqSize && reqSize > maxAllowSize) {
        req.fileValidationError = {
          [file.fieldname]: "Uploaded file is too large to upload..!!",
        };
        return cb(
          null,
          false,
          new Error("Uploaded file is too large to upload..!!")
        );
      }

      if (isImage && isVideo) {
        // Allow either image or video mimetypes
        if (
          !SUPPORTED_FORMATS_IMAGE.includes(file.mimetype) &&
          !file.mimetype.startsWith("video/")
        ) {
          req.fileValidationError = {
            [file.fieldname]: "Please upload image or video files only.",
          };
          return cb(
            null,
            false,
            new Error("Please upload image or video files only.")
          );
        }
      } else if (isImage) {
        if (!SUPPORTED_FORMATS_IMAGE.includes(file.mimetype)) {
          req.fileValidationError = {
            [file.fieldname]: "Please upload image files only.",
          };
          return cb(null, false, new Error("Please upload image files only."));
        }
      } else if (isVideo) {
        if (!file.mimetype.startsWith("video/")) {
          req.fileValidationError = {
            [file.fieldname]: "Please upload video files only.",
          };
          return cb(null, false, new Error("Please upload video files only."));
        }
      }

      // Check uploaded file is Document.
      if (isDoc && !SUPPORTED_FORMATS_DOC.includes(file.mimetype)) {
        req.fileValidationError = {
          [file.fieldname]: "Please select document file Only..!!",
        };
        return cb(
          null,
          false,
          new Error("Please select document file Only..!!")
        );
      }

      cb(null, true);
    };

    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        let pathToSave = `public/uploads/${dir}`;
        fs.mkdirSync(pathToSave, { recursive: true });
        return cb(null, pathToSave);
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = `${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}${path.extname(file.originalname)}`;
        cb(null, file.fieldname + "-" + uniqueSuffix);
      },
    });

    this.upload = multer({
      storage,
      fileFilter,
      limits: { fileSize: maxAllowSize },
    });
  }
  single(fieldName = "image") {
    return this.upload.single(fieldName);
  }

  array(fieldName = "image", maxCount = 5) {
    return this.upload.array(fieldName, maxCount);
  }
  fields(fieldsArray) {
    return this.upload.fields(fieldsArray);
  }
  any() {
    return this.upload.any();
  }
};

// exports.uploadImage = multer({
//   storage: storage,
//   fileFilter: (req, file, cb) => {
//     const fileTypes = /jpg|jpeg|png/; // Allowed file types
//     const extname = fileTypes.test(
//       path.extname(file.originalname).toLowerCase()
//     );
//     if (extname) {
//       cb(null, true);
//     } else {
//       cb(new Error("Only .jpg, .jpeg, .png files are allowed"), false);
//     }
//   },
// });

// exports.uploadDoc = multer({
//   storage: storage,
//   fileFilter: (req, file, cb) => {
//     const fileTypes = /jpg|jpeg|png|doc|pdf|xlsx|docx/; // Allowed file types
//     const extname = fileTypes.test(
//       path.extname(file.originalname).toLowerCase()
//     );
//     if (extname) {
//       cb(null, true);
//     } else {
//       cb(
//         new Error(
//           "Only .json, .jpg, .jpeg, .xlsx, .pdf, .doc and .docx files are allowed"
//         ),
//         false
//       );
//     }
//   },
// });

// exports.uploadDocAndVideo = multer({
//   storage: storage,
//   fileFilter: (req, file, cb) => {
//     const fileTypes = /mp4|pdf/; // Allowed file types
//     const extname = fileTypes.test(
//       path.extname(file.originalname).toLowerCase()
//     );
//     if (extname) {
//       cb(null, true);
//     } else {
//       cb(new Error("Only .mp4 and .pdf files are allowed"), false);
//     }
//   },
// });

// exports.uploadCsv = multer({
//   storage: storage,
//   fileFilter: (req, file, cb) => {
//     const fileTypes = /csv/; // Allowed file types
//     const extname = fileTypes.test(
//       path.extname(file.originalname).toLowerCase()
//     );
//     if (extname) {
//       cb(null, true);
//     } else {
//       cb(new Error("Only .csv file are allowed"), false);
//     }
//   },
// });

// exports.uploadXlsx = multer({
//   storage: storage,
//   fileFilter: (req, file, cb) => {
//     const fileTypes = /xlsx/; // Allowed file types
//     const extname = fileTypes.test(
//       path.extname(file.originalname).toLowerCase()
//     );
//     if (extname) {
//       cb(null, true);
//     } else {
//       cb(new Error("Only .xlsx file are allowed"), false);
//     }
//   },
// });

// exports.uploadXlsxLocal = multer({
//   storage: storage,
//   fileFilter: (req, file, cb) => {
//     const fileTypes = /xlsx/; // Allowed file types
//     const extname = fileTypes.test(
//       path.extname(file.originalname).toLowerCase()
//     );
//     if (extname) {
//       cb(null, true);
//     } else {
//       cb(new Error("Only .xlsxs file are allowed"), false);
//     }
//   },
// });

exports.deleteFile = (deleteFile) => {
  try {
    if (deleteFile === null || deleteFile == undefined) return true;

    const basePath = `${process.env.BASE_URL}uploads`;
    if (deleteFile.startsWith(basePath)) {
      deleteFile = deleteFile.replace(basePath, ""); //remove the base url from the deleteFile
    }

    if (
      ![
        "users/avatar.png",
        "admins/avatar.png",
        "customers/avatar.png",
        "products/product-placeholder.png",
        "product-categories/product-placeholder.png",
        "404-file-not-found.jpg",
      ].includes(deleteFile)
    ) {
      if (fs.existsSync(`public/uploads/` + deleteFile)) {
        fs.unlinkSync(`public/uploads/` + deleteFile);
      }
    }

    return true;
  } catch (error) {
    return false;
  }
};

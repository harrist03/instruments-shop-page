const router = require(`express`).Router()
const productsModel = require(`../models/products`)
const jwt = require('jsonwebtoken')
const fs = require('fs')
const JWT_PRIVATE_KEY = fs.readFileSync(process.env.JWT_PRIVATE_KEY_FILENAME, 'utf8')

const multer  = require('multer')
let upload = multer({dest: `${process.env.UPLOADED_FILES_FOLDER}`})

const verifyUsersJWTPassword = (req, res, next) => {
    jwt.verify(req.headers.authorization, JWT_PRIVATE_KEY, { algorithm: "HS256" }, (err, decodedToken) => {
        if (err) {
            return res.json({ errorMessage: `User is not logged in` })
        } else {
            req.decodedToken = decodedToken
            next()
        }
    })
}

const checkAdminAccess = (req, res, next) => {
    if (req.decodedToken.accessLevel >= parseInt(process.env.ACCESS_LEVEL_ADMIN)) {
        next()
    } else {
        res.json({ errorMessage: `User is not an administrator` })
    }
}

// read all records
const getAllProducts = (req, res) => {
    //user does not have to be logged in to see product details
    productsModel.find((error, data) => {
        res.json(data)
    })
}

router.get(`/products/image/:filename`, (req, res) =>
{
    fs.readFile(`${process.env.UPLOADED_FILES_FOLDER}/${req.params.filename}`, 'base64', (err, fileData) =>
    {
        if(fileData)
        {
            res.json({image:fileData})
        }
        else
        {
            res.json({image:null})
        }
    })
})

// Read one record
const getProduct = (req, res) => {
    productsModel.findById(req.params.id, (error, data) => {
        res.json(data)
    })
}

// Add new product with multiple file uploads
const createProduct =  (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.json({errorMessage: "No files were selected to be uploaded"})
    }

    let productDetails = {}

    productDetails.name = req.body.name
    productDetails.brand = req.body.brand
    productDetails.colour = req.body.colour
    productDetails.category = req.body.category
    productDetails.stock = req.body.stock
    productDetails.price = req.body.price

    productDetails.images = []
    req.files.map((file, index) => {
        productDetails.images[index] = {filename: `${file.filename}`}
    })

    productsModel.create(productDetails, (error, data) => {
        res.json(data)
    })
}



// Add new record
// const createProduct = (req, res) => {
//     // Use the new product details to create a new product document
//     productsModel.create(req.body, (error, data) => {
//         res.json(data)
//     })
// }


// Update one record
const updateProduct = (req, res) => {
    const { name, brand, colour, category, stock, price } = req.body

    const existingImages = req.body.existingImages
        ? Array.isArray(req.body.existingImages)
            ? req.body.existingImages
            : [req.body.existingImages]
        : []

    console.log("Existing Images:", existingImages)

    const newImages = req.files ? req.files.map(file => file.filename) : []

    const allImages = [...existingImages, ...newImages]
        .filter(img => img)
        .map(img => ({ filename: img }))  // Convert to objects

    console.log("All Images:", allImages)  // Debugging

    productsModel.findByIdAndUpdate(req.params.id, {
        name, brand, colour, category, stock: parseInt(stock), price: parseFloat(price), images: allImages
    }, { new: true })
        .then(updatedProduct => res.json(updatedProduct))
        .catch(err => {
            console.error("MongoDB Error:", err)
            res.status(500).json({ errorMessage: err.message })
        })
}

// // Delete one record
// router.delete(`/products/:id`, (req, res) =>
// {
//     jwt.verify(req.headers.authorization, JWT_PRIVATE_KEY, {algorithm: "HS256"}, (err, decodedToken) => {
//         if (err) {
//             res.json({errorMessage: `User is not logged in`})
//         } else {
//             if (decodedToken.accessLevel >= process.env.ACCESS_LEVEL_ADMIN) {
//                 productsModel.findByIdAndRemove(req.params.id, (error, data) => {
//                     res.json(data)
//                 })
//             } else {
//                 res.json({errorMessage: `User is not an administrator, so they cannot delete records`})
//             }
//         }
//     })
// })

const deleteProduct = (req, res) => {
    productsModel.findByIdAndRemove(req.params.id, (error, data) => {
        res.json(data)
    })
}

// Delete Image Route
router.delete(`/products/image/:filename`, verifyUsersJWTPassword, checkAdminAccess, (req, res) => {
    const filePath = `${process.env.UPLOADED_FILES_FOLDER}/${req.params.filename}`

    fs.unlink(filePath, (err) => {
        if (err) {
            console.error(`Failed to delete image: ${req.params.filename}`, err)
            return res.status(500).json({ errorMessage: `Failed to delete image` })
        }
        console.log(`Image deleted: ${req.params.filename}`)
        res.json({ message: `Image deleted successfully` })
    })
})

router.post("/products", verifyUsersJWTPassword, checkAdminAccess, upload.array("images", parseInt(process.env.MAX_NUMBER_OF_UPLOAD_FILES_ALLOWED)), createProduct)
router.get(`/products`, getAllProducts)
router.get(`/products/:id`, verifyUsersJWTPassword, getProduct)
router.put(`/products/:id`, verifyUsersJWTPassword, upload.array("images", parseInt(process.env.MAX_NUMBER_OF_UPLOAD_FILES_ALLOWED)), updateProduct)
router.delete(`/products/:id`, verifyUsersJWTPassword, checkAdminAccess, deleteProduct)

module.exports = router
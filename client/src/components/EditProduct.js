import React, {Component} from "react"
import {Redirect, Link} from "react-router-dom"
import axios from "axios"

import LinkInClass from "../components/LinkInClass"

import {ACCESS_LEVEL_NORMAL_USER, SERVER_HOST} from "../config/global_constants"

export default class EditProduct extends Component {
    constructor(props) {
        super(props)

        this.state = {
            name: ``,
            brand: ``,
            colour: ``,
            category: ``,
            stock: ``,
            price: ``,
            images: [],
            selectedFiles: [],
            previewImages: [],
            redirectToDisplayAllProducts:localStorage.accessLevel < ACCESS_LEVEL_NORMAL_USER
        }
    }

    componentDidMount() {
        this.inputToFocus.focus()

        axios.get(`${SERVER_HOST}/products/${this.props.match.params.id}`, {headers:{"authorization":localStorage.token}})
            .then(res => {
                console.log("Product Data:", res.data)
                if(res.data) {
                    if (res.data.errorMessage) {
                        console.log(res.data.errorMessage)
                    } else {
                        this.setState({
                            name: res.data.name,
                            brand: res.data.brand,
                            colour: res.data.colour,
                            category: res.data.category,
                            stock: res.data.stock,
                            price: res.data.price,
                            images: res.data.images || [] // Ensure images is always an array
                        }, () => {
                            console.log("Images State:", this.state.images) // Debugging line
                            this.loadImagePreviews(this.state.images)
                        })
                    }
                } else {
                    console.log(`Record not found`)
                }
            })
    }

    loadImagePreviews = (images) => {
        // Each image fetch request is a Promise
        // images.map() creates an array of Promises
        // Promise.all() waits for all of them to complete
        // Once done, the previews are stored in this.state.previewImages
        if (!images || images.length === 0) {
            console.log("No images found") // Debugging
            return
        }

        console.log("Loading previews for images:", images) // Debugging

        // Extract filenames from image objects
        const filenames = images.map(img => img.filename)

        const previewPromises = filenames.map(filename =>
            axios.get(`${SERVER_HOST}/products/image/${filename}`)
                .then(res => {
                    if (res.data.image) {
                        return `data:image/png;base64,${res.data.image}`
                    }
                    return null
                })
                .catch(err => {
                    console.error(`Error loading image ${filename}:`, err)
                    return null
                })
        )

        Promise.all(previewPromises).then(previews => {
            console.log("Loaded image previews:", previews) // Debugging
            this.setState({ previewImages: previews.filter(img => img !== null) })
        })
    }

    handleChange = (e) => {
        this.setState({[e.target.name]: e.target.value})
    }

    handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files)

        this.setState({ selectedFiles }, () => {
            const previews = selectedFiles.map(file => URL.createObjectURL(file))
            this.setState({ previewImages: [...this.state.previewImages, ...previews] })
        })
    }

    handleRemoveImage = (index) => {
        // Remove preview image from state
        const updatedPreviews = [...this.state.previewImages]
        updatedPreviews.splice(index, 1)

        // Remove filename from images array (for existing images only)
        const updatedImages = [...this.state.images]
        const removedImage = updatedImages.splice(index, 1)[0]

        this.setState({
            previewImages: updatedPreviews,
            images: updatedImages
        }, () => {
            axios.delete(`${SERVER_HOST}/products/image/${removedImage.filename}`, {headers: { "authorization": localStorage.token }})
                .then(res => {
                    console.log("Image deleted successfully:", res.data.message)
                })
                .catch(err => {
                    console.error("Failed to delete image:", err)
                })
        })
    }

    handleSubmit = (e) => {
        e.preventDefault()

        let formData = new FormData()
        this.setState({ wasSubmittedAtLeastOnce: true })
        const formInputsState = this.validate()

        if (Object.keys(formInputsState).every(index => formInputsState[index])) {
            formData.append("name", this.state.name)
            formData.append("brand", this.state.brand)
            formData.append("colour", this.state.colour)
            formData.append("category", this.state.category)
            formData.append("stock", parseInt(this.state.stock))
            formData.append("price", parseFloat(this.state.price))

            // Append existing images (as filenames)
            this.state.images.forEach(img => {
                formData.append("existingImages", img.filename)
            })

            // Append new images (as File objects)
            if (this.state.selectedFiles) {
                for (let i = 0; i < this.state.selectedFiles.length; i++) {
                    formData.append("images", this.state.selectedFiles[i]) // Append each file separately
                }
            }

            axios.put(`${SERVER_HOST}/products/${this.props.match.params.id}`,  formData, {headers:{"authorization":localStorage.token, "Content-Type": "multipart/form-data"}})
                .then(res => {
                    if(res.data) {
                        if (res.data.errorMessage) {
                            console.log(res.data.errorMessage)
                        } else {
                            console.log(`Record updated`)
                            this.setState({redirectToDisplayAllProducts:true})
                        }
                    } else {
                        console.log(`Record not updated`)
                    }
                })
        }
    }

    validateName() {
        const pattern = /^[A-Za-z0-9 ]+$/ // allows letters, numbers, and spaces
        return pattern.test(String(this.state.name).trim())
    }

    validateBrand() {
        const pattern = /^[A-Za-z0-9 ]+$/ // allows letters, numbers, and spaces
        return pattern.test(String(this.state.brand).trim())
    }

    validateColour() {
        const pattern = /^[A-Za-z]+$/ // only letters (red, blue, etc.)
        return pattern.test(String(this.state.colour).trim());
    }

    validateCategory() {
        const pattern = /^[A-Za-z]+$/ // only letters (guitar, piano, etc.)
        return pattern.test(String(this.state.category).trim());
    }

    validateStock() {
        const stock = parseInt(this.state.stock)
        return Number.isInteger(stock) && stock >= 0 // no negative values
    }


    validatePrice() {
        const price = parseInt(this.state.price);
        return Number.isInteger(price) && price >= 0 // no negative values
    }

    validate() {
        return {
            name: this.validateName(),
            brand: this.validateBrand(),
            colour: this.validateColour(),
            category: this.validateCategory(),
            stock: this.validateStock(),
            price: this.validatePrice(),
        }
    }

    render() {
        return (
            <div className="body-container">

                {this.state.redirectToDisplayAllProducts ? <Redirect to="/DisplayAllProducts"/> : null}

                <form>
                    <div>
                        <label htmlFor="name">Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={this.state.name}
                            onChange={this.handleChange}
                            ref={(input) => { this.inputToFocus = input; }}
                        />
                    </div>

                    <div>
                        <label htmlFor="brand">Brand</label>
                        <input
                            type="text"
                            id="brand"
                            name="brand"
                            value={this.state.brand}
                            onChange={this.handleChange}
                        />
                    </div>

                    <div>
                        <label htmlFor="colour">Colour</label>
                        <input
                            type="text"
                            id="colour"
                            name="colour"
                            value={this.state.colour}
                            onChange={this.handleChange}
                        />
                    </div>

                    <div>
                        <label htmlFor="category">Category</label>
                        <input
                            type="text"
                            id="category"
                            name="category"
                            value={this.state.category}
                            onChange={this.handleChange}
                        />
                    </div>

                    <div>
                        <label htmlFor="stock">Stock</label>
                        <input
                            type="number"
                            id="stock"
                            name="stock"
                            value={this.state.stock}
                            onChange={this.handleChange}
                            min="0"
                        />
                    </div>

                    <div>
                        <label htmlFor="price">Price</label>
                        <input
                            type="number"
                            id="price"
                            name="price"
                            value={this.state.price}
                            onChange={this.handleChange}
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <div>
                        <label>Upload Images</label>
                        <input type="file" multiple onChange={this.handleFileChange} />
                    </div>

                    {/* Image Previews */}
                    <div className="image-preview-container">
                        {this.state.previewImages.map((img, index) => (
                            <div key={index} className="image-preview-wrapper">
                                <img src={img} alt="Preview" className="image-preview" />
                                <button
                                    type="button"
                                    className="remove-image-button"
                                    onClick={() => this.handleRemoveImage(index)}
                                >
                                    ❌
                                </button>
                            </div>
                        ))}
                    </div>

                    <LinkInClass value="Update" className="green-button" onClick={this.handleSubmit}/>
                    <Link className="red-button" to={"/DisplayAllProducts"}>Cancel</Link>
                </form>
            </div>
        )
    }
}
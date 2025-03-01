import React, { Component } from "react"
import { Link } from "react-router-dom"
import axios from "axios"

import {ACCESS_LEVEL_GUEST, ACCESS_LEVEL_ADMIN, SERVER_HOST} from "../config/global_constants"

export default class ProductDetails extends Component {
    constructor(props) {
        super(props)

        this.state = {
            product: {},
            redirectToDisplayAllProducts: localStorage.accessLevel < ACCESS_LEVEL_GUEST
        }
    }

    componentDidMount() {

        axios.get(`${SERVER_HOST}/products/${this.props.match.params.id}`, { headers: { "authorization": localStorage.token } })
            .then(res => {
                if (res.data) {
                    if (res.data.errorMessage) {
                        console.log(res.data.errorMessage)
                    } else {
                        this.setState({ product: res.data })
                        console.log("Product details retrieved")
                    }
                } else {
                    console.log("Product not found")
                }
            })
            .catch(err => console.error("Error fetching product:", err))
    }

    render() {
        const { product } = this.state

        return (
            <div className="body-container">
                <div className="product-details-container">
                    <div className="product-details">
                        <div className="product-image">
                            {/*{product.images.forEach(image => */}
                            {/*    <img src={image.file} key={image.id} />*/}
                            {/*    alt={product.name}*/}
                            {/*    />*/}
                            {/*)}*/}

                        </div>
                        <div className="product-info">
                            <h2>{product.name}</h2>
                            <p className="details">{product.category}</p>
                            {/*<p>{product.brand}</p>*/}
                            <p className="details"><strong>Colour:</strong> {product.colour}</p>
                            <p className="details"><i>{product.stock} units left</i></p>
                            <h3><span id="price-text"><b>Price: </b></span>€{product.price}</h3>

                            {localStorage.accessLevel > ACCESS_LEVEL_GUEST ? <Link className="green-button" to={"/EditProduct/" + product._id}>Edit</Link> : null}
                            {localStorage.accessLevel >= ACCESS_LEVEL_ADMIN ? <Link className="red-button" to={"/DeleteProduct/" + product._id}>Delete</Link> : null}
                            <Link className="red-button" to={"/DisplayAllProducts"}>Back</Link>
                        </div>

                    </div>
                </div>
            </div>
        )
    }
}

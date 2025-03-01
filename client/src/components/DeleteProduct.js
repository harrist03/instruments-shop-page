import React, {Component} from "react"
import {Redirect} from "react-router-dom"
import axios from "axios"

import {SERVER_HOST} from "../config/global_constants"


export default class DeleteProduct extends Component {
    constructor(props) {
        super(props)

        this.state = {
            images: [],
            redirectToDisplayAllProducts:false
        }
    }
    componentDidMount() {
        axios.get(`${SERVER_HOST}/products/${this.props.match.params.id}`, { headers: { "authorization": localStorage.token } })
            .then(res => {
                if (res.data) {
                    if (res.data.errorMessage) {
                        console.log(res.data.errorMessage)
                    } else {
                        const imageDeletePromises = (res.data.images || []).map(image =>
                            axios.delete(`${SERVER_HOST}/products/image/${image.filename}`, { headers: { "authorization": localStorage.token } })
                                .then(res => console.log("Image deleted successfully:", res.data.message))
                                .catch(err => console.error("Failed to delete image:", err))
                        )

                        // Promise.all() waits for all of them to complete
                        // Ensure all images are deleted before deleting the product
                        Promise.all(imageDeletePromises)
                            .then(() => {
                                return axios.delete(`${SERVER_HOST}/products/${this.props.match.params.id}`, { headers: { "authorization": localStorage.token } })
                            })
                            .then(res => {
                                if (res.data) {
                                    if (res.data.errorMessage) {
                                        console.log(res.data.errorMessage)
                                    } else {
                                        console.log("Record deleted")
                                    }
                                    this.setState({ redirectToDisplayAllProducts: true })
                                } else {
                                    console.log("Record not deleted")
                                }
                            })
                    }
                } else {
                    console.log(`Record not found`)
                }
            })
    }

    render()
    {
        return (
            <div>
                {this.state.redirectToDisplayAllProducts ? <Redirect to="/DisplayAllCProducts"/> : null}
            </div>
        )
    }
}
import express from "express"
import {sendRequest} from "../Controllers/courseRequest.controller.js"
import {verifyTokenOptional} from "../middleware/verifytoken.js"

const router = express.Router()

router.post("/", verifyTokenOptional, sendRequest)

export default router
import courseRequest from "../Models/CourseRequest.js"

export const sendRequest = async(req, res) => {
    try{
        const {courseName, category, email, notes} = req.body
        const requestCourse = await courseRequest.create({
            courseName,
            category,
            email,
            notes,
            userId: req.userId || null
        })
        res.status(201).json({
            success: true,
            message: "Course Request sent successfully",
            data: requestCourse
        })
    } catch(error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}
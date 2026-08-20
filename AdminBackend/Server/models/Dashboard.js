import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    empId: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
  },
  { _id: false }
);

const dashboardSchema = new mongoose.Schema({
  totalEmployees: {
    type: Number,
    default: 0,
  },
  totalServices: {
    type: Number,
    default: 0,
  },
  employees: [employeeSchema],
});

export default mongoose.model("Dashboard", dashboardSchema);

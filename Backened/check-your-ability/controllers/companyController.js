import Company from "../models/Company.js";

// ✅ Helper — normalize name for case-insensitive matching (handle undefined)
const formatCompanyName = (name) => name ? name.trim().toLowerCase() : null;

// ✅ CREATE — Add new company or add new roles to existing company
export const addCompany = async (req, res) => {
  try {
    const { name, roles } = req.body;

    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one role is required",
      });
    }

    const formattedName = formatCompanyName(name);

    // 🔍 Check if company exists (case-insensitive)
    let company = formattedName 
      ? await Company.findOne({ name: formattedName })
      : null;

    if (company) {
      // ✅ Add new roles if they don’t exist already
      roles.forEach((newRole) => {
        const roleExists = company.roles.some(
          (r) => r.name.toLowerCase() === newRole.name.toLowerCase()
        );
        if (!roleExists) {
          company.roles.push(newRole);
        }
      });

      await company.save();

      return res.status(200).json({
        success: true,
        message: "New roles added to existing company",
        company,
      });
    }

    // 🆕 If company doesn’t exist, create a new one
    company = new Company({
      name: formattedName,
      roles,
    });

    await company.save();

    res.status(201).json({
      success: true,
      message: "Company created successfully with roles and rounds",
      company,
    });
  } catch (error) {
    console.error("Error adding company:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ READ — Get all company names
export const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find({}, "name");
    res.status(200).json(companies.map((c) => c.name));
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ READ — Get roles for a specific company
export const getRolesByCompany = async (req, res) => {
  try {
    const { companyName } = req.params;

    const company = await Company.findOne({
      name: { $regex: new RegExp(`^${companyName}$`, "i") },
    });

    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    res.status(200).json(company.roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ READ — Get rounds for a specific company and role
export const getRoundsByCompanyAndRole = async (req, res) => {
  try {
    const { companyName, roleName } = req.params;

    const company = await Company.findOne({
      name: { $regex: new RegExp(`^${companyName}$`, "i") },
    });

    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    const role = company.roles.find(
      (r) => r.name.toLowerCase() === roleName.toLowerCase()
    );

    if (!role) {
      return res
        .status(404)
        .json({ success: false, message: "Role not found for this company" });
    }

    res.status(200).json({ success: true, rounds: role.rounds });
  } catch (error) {
    console.error("Error fetching rounds:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while fetching rounds" });
  }
};

// ✅ UPDATE — Update company name or roles
export const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, roles } = req.body;

    const updateData = {};
    if (name) updateData.name = formatCompanyName(name);
    if (roles && Array.isArray(roles)) updateData.roles = roles;

    const updatedCompany = await Company.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedCompany) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    res.status(200).json({
      success: true,
      message: "Company updated successfully",
      company: updatedCompany,
    });
  } catch (error) {
    console.error("Error updating company:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ DELETE — Delete company
export const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCompany = await Company.findByIdAndDelete(id);

    if (!deletedCompany) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Company deleted successfully" });
  } catch (error) {
    console.error("Error deleting company:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

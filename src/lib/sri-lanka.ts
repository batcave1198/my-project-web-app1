/** The 25 districts of Sri Lanka, grouped by province. */
export const sriLankaProvinces = [
  {
    name: "Western",
    districts: ["Colombo", "Gampaha", "Kalutara"],
  },
  {
    name: "Central",
    districts: ["Kandy", "Matale", "Nuwara Eliya"],
  },
  {
    name: "Southern",
    districts: ["Galle", "Matara", "Hambantota"],
  },
  {
    name: "Northern",
    districts: ["Jaffna", "Kilinochchi", "Mannar", "Mullaitivu", "Vavuniya"],
  },
  {
    name: "Eastern",
    districts: ["Batticaloa", "Ampara", "Trincomalee"],
  },
  {
    name: "North Western",
    districts: ["Kurunegala", "Puttalam"],
  },
  {
    name: "North Central",
    districts: ["Anuradhapura", "Polonnaruwa"],
  },
  {
    name: "Uva",
    districts: ["Badulla", "Monaragala"],
  },
  {
    name: "Sabaragamuwa",
    districts: ["Ratnapura", "Kegalle"],
  },
] as const;

export const sriLankaDistricts = sriLankaProvinces.flatMap((province) => province.districts);

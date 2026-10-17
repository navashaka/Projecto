import React from "react";
import { useNavigate } from "react-router-dom";
import CompanyProfileForm from "../../components/company-profile/CompanyProfileForm";

const CreateCompanyProfilePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <CompanyProfileForm
      onRegistrationSuccess={() => navigate("/login", { replace: true })}
    />
  );
};

export default CreateCompanyProfilePage;
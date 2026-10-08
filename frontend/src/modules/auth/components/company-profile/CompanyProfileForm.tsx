import React, { useEffect, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

interface Country {
  id: number;
  country: string;
  abbreviation?: string | null;
  capital_city?: string | null;
  continent?: string | null;
  currency?: string | null;
  currency_code?: string | null;
  region?: string | null;
}

const CompanyProfileForm: React.FC = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [pincodes, setPincodes] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  const [formData, setFormData] = useState({
    organizationName: "",
    cin: "",
    pan: "",
    gst: "",

    address: "",
    doorNo: "",
    buildingName: "",
    landmark: "",
    streetName: "",
    area: "",
    city: "",
    state: "",
    pinCode: "",
    country: "India",

    accountType: "",
    glAccount: "",
    primaryAccountNo: "",
    primaryIfsc: "",
    secondaryAccountNo: "",
    secondaryIfsc: "",
    currency: "INR",

    manufacturing: false,
    trading: false,
    serviceProvider: false,
    allBusiness: false,
  });

  useEffect(() => {
    const loadCountries = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/location/countries"
        );

        if (!response.ok) {
          throw new Error("Failed to load countries");
        }

        const data: Country[] = await response.json();

        setCountries(data);

        const india = data.find(
          (country) => country.country.toLowerCase() === "india"
        );

        if (india) {
          setSelectedCountry(india);

          setFormData((previous) => ({
            ...previous,
            country: india.country,
          }));
        }
      } catch (error) {
        console.error("Country loading error:", error);
      }
    };

    loadCountries();
  }, []);

  const loadPincodes = async (
    countryId: number,
    search: string = ""
  ) => {
    try {
      setPincodeLoading(true);

      const params = new URLSearchParams({
        country_id: countryId.toString(),
        limit: "50",
      });

      if (search.trim()) {
        params.append("search", search.trim());
      }

      const response = await fetch(
        `http://127.0.0.1:8000/location/pincodes?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to load pincodes");
      }

      const data: string[] = await response.json();

      setPincodes(data);
    } catch (error) {
      console.error("Pincode loading error:", error);
      setPincodes([]);
    } finally {
      setPincodeLoading(false);
    }
  };

  const handleCountryChange = (
    _event: React.SyntheticEvent,
    country: Country | null
  ) => {
    setSelectedCountry(country);

    setFormData((previous) => ({
      ...previous,
      country: country?.country || "",
      pinCode: "",
    }));

    setPincodes([]);

    if (country) {
      loadPincodes(country.id);
    }
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: checked,
    }));
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const payload = {
      organization_name: formData.organizationName,
      cin: formData.cin,
      pan: formData.pan,
      gst: formData.gst,

      address: formData.address,
      door_no: formData.doorNo,
      building_name: formData.buildingName,
      landmark: formData.landmark,
      street_name: formData.streetName,
      area: formData.area,
      city: formData.city,
      state: formData.state,
      pin_code: formData.pinCode,
      country: formData.country,

      account_type: formData.accountType,
      gl_account: formData.glAccount,
      primary_account_no: formData.primaryAccountNo,
      primary_ifsc: formData.primaryIfsc,
      secondary_account_no: formData.secondaryAccountNo,
      secondary_ifsc: formData.secondaryIfsc,
      currency: formData.currency,

      manufacturing: formData.manufacturing,
      trading: formData.trading,
      service_provider: formData.serviceProvider,
      all_business: formData.allBusiness,
    };

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/company/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to save company profile"
        );
      }

      console.log("Company Profile Saved:", data);

      alert("Company Profile saved successfully!");
    } catch (error) {
      console.error("Company Profile Error:", error);

      alert("Failed to save Company Profile");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 600,
          mb: 3,
        }}
      >
        Company Profile
      </Typography>

      <Paper
        elevation={0}
        sx={{
          border: "1px solid #ddd",
          borderRadius: 2,
          p: 3,
        }}
      >
        <Box component="form" onSubmit={handleSubmit}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 2,
            }}
          >
            Profile
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                required
                label="Name of the Organization"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleChange}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="CIN / Firm Registration"
                name="cin"
                value={formData.cin}
                onChange={handleChange}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="PAN"
                name="pan"
                value={formData.pan}
                onChange={handleChange}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="GST Registration of Corporate Office"
                name="gst"
                value={formData.gst}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mt: 4,
              mb: 2,
            }}
          >
            Address
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Address of Corporate Office / Registered Office"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Door No / House No / Flat No / Survey No / Floor No"
                name="doorNo"
                value={formData.doorNo}
                onChange={handleChange}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Name of Building"
                name="buildingName"
                value={formData.buildingName}
                onChange={handleChange}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Landmark"
                name="landmark"
                value={formData.landmark}
                onChange={handleChange}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Street Name / Road No."
                name="streetName"
                value={formData.streetName}
                onChange={handleChange}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Area / Colony"
                name="area"
                value={formData.area}
                onChange={handleChange}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="State"
                name="state"
                value={formData.state}
                onChange={handleChange}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                fullWidth
                options={pincodes}
                value={
                  formData.pinCode
                    ? formData.pinCode
                    : null
                }
                loading={pincodeLoading}
                onOpen={() => {
                  if (selectedCountry) {
                    loadPincodes(selectedCountry.id);
                  }
                }}
                onInputChange={(_event, value) => {
                  if (selectedCountry) {
                    loadPincodes(
                      selectedCountry.id,
                      value
                    );
                  }
                }}
                onChange={(_event, value) => {
                  setFormData((previous) => ({
                    ...previous,
                    pinCode: value || "",
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="PIN Code"
                    required
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                fullWidth
                options={countries}
                value={selectedCountry}
                onChange={handleCountryChange}
                getOptionLabel={(option) => option.country}
                isOptionEqualToValue={(option, value) =>
                  option.id === value.id
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Country"
                    required
                  />
                )}
              />
            </Grid>
          </Grid>

          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mt: 4,
              mb: 2,
            }}
          >
            Banks & Accounts
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="Type of Account"
                name="accountType"
                value={formData.accountType}
                onChange={handleChange}
              >
                <MenuItem value="Current">Current</MenuItem>
                <MenuItem value="OD">OD</MenuItem>
                <MenuItem value="OCC">OCC</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="GL Account"
                name="glAccount"
                value={formData.glAccount}
                onChange={handleChange}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Primary Bank Account No."
                name="primaryAccountNo"
                value={formData.primaryAccountNo}
                onChange={handleChange}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="IFSC"
                name="primaryIfsc"
                value={formData.primaryIfsc}
                onChange={handleChange}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Secondary Bank Account No."
                name="secondaryAccountNo"
                value={formData.secondaryAccountNo}
                onChange={handleChange}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="IFSC"
                name="secondaryIfsc"
                value={formData.secondaryIfsc}
                onChange={handleChange}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="Primary Currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
              >
                <MenuItem value="INR">INR</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mt: 4,
              mb: 2,
            }}
          >
            Business
          </Typography>

          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  name="manufacturing"
                  checked={formData.manufacturing}
                  onChange={handleCheckboxChange}
                />
              }
              label="Manufacturing"
            />

            <FormControlLabel
              control={
                <Checkbox
                  name="trading"
                  checked={formData.trading}
                  onChange={handleCheckboxChange}
                />
              }
              label="Trading"
            />

            <FormControlLabel
              control={
                <Checkbox
                  name="serviceProvider"
                  checked={formData.serviceProvider}
                  onChange={handleCheckboxChange}
                />
              }
              label="Service Provider"
            />

            <FormControlLabel
              control={
                <Checkbox
                  name="allBusiness"
                  checked={formData.allBusiness}
                  onChange={handleCheckboxChange}
                />
              }
              label="All"
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mt: 4,
            }}
          >
            <Button type="submit" variant="contained">
              Submit
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default CompanyProfileForm;
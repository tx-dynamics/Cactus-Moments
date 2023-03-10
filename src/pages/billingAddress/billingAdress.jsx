import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { radio, radioFilled } from "../../assets";
import { Footer, TextInput } from "../../components";
import DropDownDate from "../../components/dropDownDate/dropDownDate";
import Navbar from "../../components/navBar/Navbar";
import TextInputBilling from "../../components/textInputBilling/textInputBilling";
import "./billingAdress.css";

const mrArr = [
  {
    id: 1,
    title: "Mr",
  },
  {
    id: 1,
    title: "Mrs",
  },
];

const yearArr = [];

const dayArr = [];

const monthArr = [
  { label: "january", value: "january" },
  { label: "February", value: "February" },
  { label: "March", value: "March" },
  { label: "May", value: "May" },
  { label: "Jun", value: "Jun" },
  { label: "July", value: "July" },
  { label: "August", value: "August" },
  { label: "September", value: "September" },
  { label: "October", value: "october" },
  { label: "November", value: "november" },
  { label: "December", value: "december" },
];

const countryArr = [
  { label: "UK", value: "UK" },
  { label: "Germany", value: "germany" },
  { label: "France", value: "France" },
  { label: "Spain", value: "Spain" },
  { label: "England", value: "England" },
  { label: "USA", value: "Usa" },
];

const BillingAdress = () => {
  const navigate = useNavigate();
  const [ischecked, setIschecked] = useState(false);
  const [selectMr, setSelectMr] = React.useState({ Id: 1, title: "Mr" });
  const [dayselect, setDaySelected] = useState({ label: "Day", value: "Day" });
  const [countryselect, setCountrySelected] = useState({
    label: "England",
    value: "England",
  });
  const [monthSelect, setMonthSelected] = useState({
    label: "Month",
    value: "Month",
  });
  const [yearSelect, setYearSelect] = useState({
    label: "Year",
    value: "Year",
  });

  useEffect(() => {
    for (let i = 0; i < 32; i++) {
      dayArr.push({ label: i, value: i });
    }

    for (let i = 1946; i <= 2023; i++) {
      yearArr.push({ label: i, value: i });
    }
  }, []);

  return (
    <>
      <Navbar />

      <div className="billing-address-main-container">
        <div className="billing-address-add-billing-main-container">
          <h1>Billing Address</h1>

          <div className="billing-address-select-mr-container">
            <div className="billing-address-select-mr-sub-container">
              {mrArr.map((item) => (
                <>
                  <div
                    onClick={() => setSelectMr(item)}
                    className="billing-address-radio-btn-container"
                  >
                    <img
                      src={selectMr.title == item.title ? radioFilled : radio}
                    />
                    <p>{item.title}</p>
                  </div>
                </>
              ))}
            </div>
          </div>
          <div className="billing-address-add-billing-container">
            <div className="billing-address-input-container1">
              <TextInputBilling
                inputStyle={{ width: "70%" }}
                title={"First Name*"}
                type={"text"}
              />
              <TextInputBilling
                inputStyle={{ width: "70%" }}
                title={"Last Name*"}
                type={"text"}
              />
              <TextInputBilling
                inputStyle={{ width: "65%" }}
                title={"Email Address*"}
                type={"email"}
              />
              <TextInputBilling
                inputStyle={{ width: "75%" }}
                title={"Mobile*"}
                type={"number"}
              />
              <div className="text-input-billing-main-container">
                <div className="text-input-billing-divider-container">
                  <h3>Date of Birth*</h3>
                  <div className="text-input-billing-input-divider"></div>
                </div>
                <DropDownDate
                  options={dayArr}
                  selected={dayselect}
                  setSelected={setDaySelected}
                  bg={{ width: "10rem" }}
                />
                <div className="text-input-billing-input-divider"></div>
                <DropDownDate
                  options={monthArr}
                  selected={monthSelect}
                  setSelected={setMonthSelected}
                  bg={{ width: "15rem" }}
                />
                <div className="text-input-billing-input-divider"></div>
                <DropDownDate
                  options={yearArr}
                  selected={yearSelect}
                  setSelected={setYearSelect}
                  bg={{ width: "10rem" }}
                />
              </div>
            </div>
            <div className="billing-address-input-container2">
              <div
                style={{ width: "100%" }}
                className="text-input-billing-main-container"
              >
                <div className="text-input-billing-divider-container">
                  <h3>Date of Birth*</h3>
                  <div className="text-input-billing-input-divider"></div>
                </div>
                <DropDownDate
                  options={countryArr}
                  selected={countryselect}
                  setSelected={setCountrySelected}
                  bg={{ width: "40rem" }}
                />
              </div>
              <TextInputBilling
                inputStyle={{ width: "80%" }}
                title={"City*"}
                type={"text"}
              />
              <TextInputBilling
                inputStyle={{ width: "75%" }}
                title={"Post Code*"}
                type={"number"}
              />
              <TextInputBilling
                inputStyle={{ width: "75%" }}
                title={"Address*"}
                type={"text"}
              />
              <TextInputBilling
                inputStyle={{ width: "65%" }}
                title={"Address line 2*"}
                type={"text"}
              />
            </div>
          </div>
        </div>
        <div className="billing-address-move-next-main-container">
          <div className="billing-address-checkBox-container">
            <input
              checked={ischecked}
              onChange={() => setIschecked(!ischecked)}
              type="checkbox"
            />
            <p>
              I Agree with all{" "}
              <span style={{ textDecoration: "underline" }}>
                term & Conditions Contact us for more details
              </span>
            </p>
          </div>
          <div
            onClick={() => navigate("/payment")}
            className="billing-address-move-next-btn-container"
          >
            <p>Next</p>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default BillingAdress;

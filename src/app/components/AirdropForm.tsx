"use client";
import { InputForm } from "./ui/InputField";
import { useState } from "react";

export default function AirdropForm() {
  const [tokenAddress, setTokenAddress] = useState("");
  return (
    <InputForm
      label="Token Address"
      value={tokenAddress}
      onChange={(e) => setTokenAddress(e.target.value)}
      type="text"
      placeholder="Enter token address"
    />
  );
}

"use client";
import { InputForm } from "./ui/InputField";
import { useState } from "react";
import { useAccount, useChainId, useConfig, useWriteContract } from "wagmi";
import { readContract } from "@wagmi/core";
import { erc20Abi, chainsToTSender, tsenderAbi } from "@/constants";
import { useMemo } from "react";
import { calculateTotal } from "@/utils/calculateTotal/calculateTotal";
import { writeContract } from "@wagmi/core";
import { waitForTransactionReceipt } from "@wagmi/core";

export default function AirdropForm() {
  const [tokenAddress, setTokenAddress] = useState("");
  const [recipients, setRecipients] = useState("");
  const [amounts, setAmounts] = useState("");
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const config = useConfig();
  const total: number = useMemo(() => calculateTotal(amounts), [amounts]);
  const { data: hash, isPending, writeContractAsync } = useWriteContract();

  async function getApprovedAmount(
    tSenderAddress: string | null
  ): Promise<number> {
    if (!isConnected || !address) {
      alert("Please connect your wallet first");
      return 0;
    }
    if (!tSenderAddress) {
      alert("No TSender address found for this network");
      return 0;
    }

    try {
      const response = await readContract(config, {
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, tSenderAddress as `0x${string}`],
      });
      return response as number;
    } catch (error) {
      console.error("Error reading contract:", error);
      alert("Failed to read contract allowance");
      return 0;
    }
  }

  async function handleSubmit() {
    console.log(chainId);
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }
    if (!tokenAddress) {
      alert("Please enter a token address");
      return;
    }
    if (!recipients) {
      alert("Please enter a recipient address");
      return;
    }
    if (!amounts) {
      alert("Please enter an amount");
      return;
    }

    const tSenderAddress = chainsToTSender[chainId]["tsender"];
    const approvedAmount = await getApprovedAmount(tSenderAddress);

    if (approvedAmount < total) {
      // approve first
      const approvalHash = await writeContractAsync({
        abi: erc20Abi,
        address: tokenAddress as `0x${string}`,
        functionName: "approve",
        args: [tSenderAddress as `0x${string}`, BigInt(total)],
      });
      const approvalReceipt = await waitForTransactionReceipt(config, {
        hash: approvalHash,
      });
      console.log("Approval receipt: ", approvalReceipt);

      // then send
      await writeContractAsync({
        abi: tsenderAbi,
        address: tSenderAddress as `0x${string}`,
        functionName: "airdropERC20",
        args: [
          tokenAddress,
          // Comma or new line separated
          recipients
            .split(/[,\n]+/)
            .map((addr) => addr.trim())
            .filter((addr) => addr !== ""),
          amounts
            .split(/[,\n]+/)
            .map((amt) => amt.trim())
            .filter((amt) => amt !== ""),
          BigInt(total),
        ],
      });
    } else {
      //Send funds
      await writeContractAsync({
        abi: tsenderAbi,
        address: tSenderAddress as `0x${string}`,
        functionName: "airdropERC20",
        args: [
          tokenAddress,
          // Comma or new line separated
          recipients
            .split(/[,\n]+/)
            .map((addr) => addr.trim())
            .filter((addr) => addr !== ""),
          amounts
            .split(/[,\n]+/)
            .map((amt) => amt.trim())
            .filter((amt) => amt !== ""),
          BigInt(total),
        ],
      });
    }
    // try {
    //   const tSenderAddress = chainsToTSender[chainId]["tsender"];
    //   if (!tSenderAddress) {
    //     alert("Please connect to a supported network");
    //     return;
    //   }
    //   const approvedAmount = await getApprovedAmount(tSenderAddress);
    //   console.log("Amount approved: ", approvedAmount);
    //   console.log("Total amount: ", total);
    // } catch (error) {
    //   console.error("Error during submission process: ", error);
    //   alert("An error occurred while processing your request");
    // }
  }

  return (
    <div>
      <InputForm
        label="Token Address"
        value={tokenAddress}
        onChange={(e) => setTokenAddress(e.target.value)}
        type="text"
        placeholder="Enter token address"
      />
      <InputForm
        label="Recipient"
        value={recipients}
        onChange={(e) => setRecipients(e.target.value)}
        large={true}
        placeholder="0x123, 0x456, ..."
      />
      <InputForm
        label="Amount"
        value={amounts}
        onChange={(e) => setAmounts(e.target.value)}
        large={true}
        placeholder="100,200,300"
      />

      <button
        onClick={handleSubmit}
        disabled={!isConnected}
        className={`px-4 py-2 rounded ${
          !isConnected ? "bg-gray-300" : "bg-blue-500 hover:bg-blue-600"
        } text-white`}
      >
        {!isConnected ? "Connect Wallet First" : "Submit"}
      </button>
    </div>
  );
}

import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto"; // Next.js (Node.js) mein ye pehle se hota hai, install nahi karna padega

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount: rawAmount, mobileNumber, email } = body;

    // 1. Sandbox (Testing) Credentials
    const storeId = "12345"; // Apni test store ID yahan likhein
    const merchantHashKey = "YOUR_HASH_KEY"; // Jo Easypaisa portal se milegi
    const orderId = `ORD-${Date.now()}`; // Har transaction ke liye unique ID
    const amount = parseFloat(rawAmount).toFixed(2); // Easypaisa ko decimal (.00) mein amount chahiye hoti hai

    // 2. Easypaisa ke mutabiq parameters ko aik silsile (format) mein jorna
    // Note: Easypaisa ka specific format unki doc ke mutabiq banta hai, ye aik standard misal hai:
    const sortedString = `amount=${amount}&emailAddress=${email}&merchantConfirmPageUrl=http://localhost:3000&orderRefNum=${orderId}&mobileNum=${mobileNumber}&storeId=${storeId}`;

    // 3. Crypto use kar ke SHA256 Hash generate karna (Yahan aap ka masla hal ho gaya)
    const generatedHash = crypto
      .createHmac("sha256", merchantHashKey)
      .update(sortedString)
      .digest("hex");

    // 4. Easypaisa Sandbox Server ko request bhejna
    const easypaisaResponse = await fetch(
      "https://easypaystg.easypaisa.com.pk/easypay/DirectPayOTP.jsf", // Staging URL
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storeId: storeId,
          orderId: orderId,
          transactionAmount: amount,
          mobileNum: mobileNumber,
          emailAddress: email,
          hashRequest: generatedHash, // Ye Crypto Hash ab sath ja rha hai!
        }),
      }
    );

    const text = await easypaisaResponse.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("Easypaisa returned non-JSON response:", easypaisaResponse.status, text.slice(0, 200));
      return NextResponse.json(
        {
          success: false,
          message: "Online payment is not configured yet (Easypaisa merchant credentials missing). Please use Cash on Delivery.",
        },
        { status: 502 }
      );
    }

    // 5. Response Check karna
    if (data.responseCode === "0000") {
      return NextResponse.json({
        success: true,
        message: "PIN prompt sent to mobile successfully",
      });
    } else {
      return NextResponse.json({
        success: false,
        message: data.responseDesc || "Easypaisa transaction failed",
      });
    }

  } catch (error) {
    console.error("Easypaisa Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
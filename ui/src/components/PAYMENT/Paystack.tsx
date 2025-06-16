// PaystackPage.tsx
import React from "react";
import { PaystackConsumer } from "react-paystack";

const PaystackPage: React.FC = () => {
  const publicKey = "pk_test_87e7e8a9aa01c5a12d634eafd861e9736b2c4c80"; // Replace with your real key
  const amount = 5000 * 100; // GHS 5000 in pesewas
  const email = "kobbimensahgh@gmail.com";
  const name = "Kobbi Mensah";
  const reference = Date.now().toString();

  const config = {
    reference,
    email,
    amount,
    currency: "GHS",
    publicKey,
    metadata: {
      custom_fields: [
        {
          display_name: "Customer Name",
          variable_name: "customer_name",
          value: name,
        },
      ],
    },
  };

  const onSuccess = (reference: string) => {
    // alert("✅ Payment Successful!\nRef: " + reference.reference);
    console.log(reference);
  };

  const onClose = () => {
    alert("❌ Payment Cancelled.");
  };

  const componentProps = {
    ...config,
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full space-y-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800">Pay with Paystack</h2>
        <p className="text-gray-600">Complete your payment of <strong>GHS 5000.00</strong> securely.</p>

        <div className="bg-gray-50 p-4 rounded-xl border text-sm text-left text-gray-700 space-y-1">
          <p><span className="font-semibold">Customer:</span> {name}</p>
          <p><span className="font-semibold">Email:</span> {email}</p>
          <p><span className="font-semibold">Reference:</span> {reference}</p>
        </div>

        <PaystackConsumer {...componentProps}>
          {({ initializePayment }) => (
            <button
              onClick={() => initializePayment(onSuccess, onClose)}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
            >
              Pay GHS 5000.00
            </button>
          )}
        </PaystackConsumer>
      </div>
    </div>
  );
};

export default PaystackPage;

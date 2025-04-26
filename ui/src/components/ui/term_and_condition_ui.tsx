import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function TermsConditions({
  children,
  onClick,
  className,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className: string;
  disabled: boolean;
}) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [expanded, setExpanded] = useState(false);

  function handleAccept() {
    setTermsAccepted((prev) => !prev);
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className={className} disabled={disabled} variant="outline">
          {children}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md h-5/6 overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Terms & Conditions</AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            Please read our terms and conditions carefully before proceeding.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4 text-sm text-left">
          <div className="space-y-2">
            <h3 className="font-semibold">Payment Terms</h3>
            <p>
              A minimum payment of 20% of the total order value is required
              before the rider confirms delivery.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Order Modification Window</h3>
            <p>
              You have a 5-minute window to make changes to your order. Check
              the cart at the top to monitor your items and make any necessary
              changes before this window expires.
            </p>
          </div>
          
          {expanded ? (
            <>
              <div className="space-y-2">
                <h3 className="font-semibold">Location Changes</h3>
                <p>
                  Changes to delivery location after the rider has begun delivery
                  will incur additional fees based on the new location.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold">Delivery Fee Structure</h3>
                <p>- 7 cedis from 6am to 5pm</p>
                <p>- 10 cedis from 5pm to 9pm</p>
                <p>- Each new order incurs a separate delivery fee</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold">Personal Data Protection</h3>
                <p>
                  We handle your personal data securely. Your information is only
                  used for internal operations.
                </p>
              </div>
              
              <Button 
                variant="ghost" 
                onClick={() => setExpanded(false)}
                className="text-blue-500 hover:text-blue-700 p-0 h-auto"
              >
                Read Less
              </Button>
            </>
          ) : (
            <Button 
              variant="ghost" 
              onClick={() => setExpanded(true)}
              className="text-blue-500 hover:text-blue-700 p-0 h-auto"
            >
              Read More
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2 py-4 bg-gray-600 rounded-md px-4">
          <Switch
            id="terms"
            checked={termsAccepted}
            onCheckedChange={handleAccept}
          />
          <Label htmlFor="terms" className="text-sm text-white">
            I accept the terms and conditions
          </Label>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onClick} disabled={!termsAccepted}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
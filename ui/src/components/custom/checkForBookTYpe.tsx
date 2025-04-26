import { Library } from "lucide-react";
import { Link } from "react-router";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog"; // Import Dialog

interface CheckForBookTypeProps {
  isDialogOpenMain: boolean;
  setDialogOpenMain: (open: boolean) => void;
}

function CheckForBookType({ isDialogOpenMain, setDialogOpenMain }: CheckForBookTypeProps) {
  return (
    <Dialog open={isDialogOpenMain} onOpenChange={setDialogOpenMain}>
      <DialogContent className="">
        <div className="flex flex-col items-center justify-center pb-8 pt-6 px-4 text-center bg-white rounded-2xl">
          <Library className="h-14 w-14 text-muted-foreground mb-6" />

          <h3 className="text-xl font-semibold">No Booking Types Available</h3>

          <p className="text-muted-foreground mt-2 mb-6">
            You haven’t set any booking types yet. Add one to manage your
            availability and let clients book with ease.
          </p>

          <Link to={`/booktypes`}>
            <Button className="flex items-center gap-2 px-4 py-2 rounded-md">
              <Library className="w-4 h-4" />
              <span>Set Book Type</span>
            </Button>
          </Link>

          <div className="text-center max-w-3xl mx-auto mt-10">
            <h1 className="text-2xl font-bold tracking-tight mb-2">
              Choose Your Booking Type
            </h1>

            <p className="text-muted-foreground text-sm">
              Pick the booking type that suits your workflow. Whether it’s consultations, sessions, or services—each option is tailored to help you stay organized.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CheckForBookType;

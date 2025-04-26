import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Item {
  name: string
  price: number
  quantity: number
}

interface ReceiptProps {
  orderNumber: string
  date: string
  time: string
  userLocation: string
  vendorNumber: string
  items: Item[]
  subtotal: number
  tax: number
  total: number
  paymentMethod: string
  lastFourDigits: string
}

export function Receipt({
  orderNumber,
  date,
  time,
  userLocation,
  vendorNumber,
  items,
  subtotal,
  tax,
  total,
  paymentMethod,
  lastFourDigits,
}: ReceiptProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Order Receipt</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-4">
          <p>
            <strong>Order Number:</strong> {orderNumber}
          </p>
          <p>
            <strong>Date:</strong> {date}
          </p>
          <p>
            <strong>Time:</strong> {time}
          </p>
          <p>
            <strong>User Location:</strong> {userLocation}
          </p>
          <p>
            <strong>Vendor Number:</strong> {vendorNumber}
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.name}</TableCell>
                <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell className="text-right">${(item.price * item.quantity).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4 space-y-2">
          <p className="flex justify-between">
            <span>Subtotal:</span> <span>${subtotal.toFixed(2)}</span>
          </p>
          <p className="flex justify-between">
            <span>Tax:</span> <span>${tax.toFixed(2)}</span>
          </p>
          <p className="flex justify-between font-bold">
            <span>Total:</span> <span>${total.toFixed(2)}</span>
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <div className="w-full">
          <p className="text-center">
            <strong>Payment Method:</strong> {paymentMethod} (**** **** **** {lastFourDigits})
          </p>
          <p className="text-center text-sm mt-2">Thank you for your purchase!</p>
        </div>
      </CardFooter>
    </Card>
  )
}


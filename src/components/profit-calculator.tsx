"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Calculator, DollarSign } from "lucide-react"

interface ProfitCalculation {
  sellingPrice: number
  costPrice: number
  shippingCost: number
  vatRate: number
  targetMargin: number
  platform: string
  platformFees: number
  profitAmount: number
  profitMargin: number
  isUnprofitable: boolean
  suggestedPrice: number
  vatPaid: number
  vatClaimed: number
  vatToPay: number
}

const COURIERS = [
  { name: "Royal Mail", cost: 4.00 },
  { name: "DPD", cost: 6.99 },
  { name: "Hermes/Evri", cost: 3.95 },
  { name: "DHL", cost: 8.50 },
  { name: "UPS", cost: 7.25 },
  { name: "Yodel", cost: 4.20 },
]

const PLATFORMS = {
  ebay: {
    name: "eBay",
    feeRate: 12, // 12% total fees
    paypalRate: 0,
    fixedFee: 0
  },
  shopify: {
    name: "Shopify",
    feeRate: 3, // 3% total fees
    paypalRate: 0,
    fixedFee: 0
  }
}

export default function ProfitCalculator() {
  const [sellingPrice, setSellingPrice] = useState<string>("")
  const [costPrice, setCostPrice] = useState<string>("")
  const [costIncludesVat, setCostIncludesVat] = useState<boolean>(true)
  const [selectedCourier, setSelectedCourier] = useState<string>("")
  const [selectedPlatform, setSelectedPlatform] = useState<string>("ebay")
  const [vatRate, setVatRate] = useState<string>("20")
  const [targetMargin, setTargetMargin] = useState<string>("30")
  const [calculation, setCalculation] = useState<ProfitCalculation | null>(null)

  const calculateProfit = () => {
    const selling = parseFloat(sellingPrice)
    const cost = parseFloat(costPrice)
    const courier = COURIERS.find(c => c.name === selectedCourier)
    const platform = PLATFORMS[selectedPlatform as keyof typeof PLATFORMS]
    const vat = parseFloat(vatRate)
    const target = parseFloat(targetMargin)

    if (!selling || !cost || !courier || !platform || !vat || !target) {
      return
    }

    const shipping = courier.cost
    
    // Calculate VAT breakdown
    const vatClaimedOnSale = (selling * vat) / (100 + vat) // VAT collected on sale (output VAT)
    const vatClaimedOnShipping = (shipping * vat) / (100 + vat) // VAT collected on shipping (output VAT)
    const vatClaimed = vatClaimedOnSale + vatClaimedOnShipping
    
    // Calculate VAT paid on cost price depending on whether cost includes VAT
    const vatPaidOnCost = costIncludesVat 
      ? (cost * vat) / (100 + vat) // Extract VAT from inclusive price
      : (cost * vat) / 100 // Calculate VAT on exclusive price
    
    const vatToPay = vatClaimed - vatPaidOnCost // Net VAT owed to HMRC
    
    // Calculate platform fees
    const platformFeeRate = platform.feeRate + platform.paypalRate
    const platformFees = (selling * platformFeeRate / 100) + platform.fixedFee
    
    // Use cost excluding VAT for total calculation (since VAT is handled separately)
    const costExVat = costIncludesVat ? cost - vatPaidOnCost : cost
    const totalCosts = costExVat + shipping + platformFees + vatToPay
    const profit = selling - totalCosts
    const margin = (profit / selling) * 100
    const isUnprofitable = margin < target
    
    // Calculate suggested price to meet target margin (accounting for VAT properly)
    const suggestedPrice = (cost + shipping + platformFees) / (1 - target/100 - (vat/(100+vat)) + (cost*vat/(100+vat))/selling)

    setCalculation({
      sellingPrice: selling,
      costPrice: cost,
      shippingCost: shipping,
      vatRate: vat,
      targetMargin: target,
      platform: platform.name,
      platformFees,
      profitAmount: profit,
      profitMargin: margin,
      isUnprofitable,
      suggestedPrice,
      vatPaid: vatPaidOnCost,
      vatClaimed,
      vatToPay
    })
  }

  const resetCalculator = () => {
    setSellingPrice("")
    setCostPrice("")
    setCostIncludesVat(true)
    setSelectedCourier("")
    setSelectedPlatform("ebay")
    setVatRate("20")
    setTargetMargin("30")
    setCalculation(null)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          <Calculator className="w-8 h-8 text-blue-600" />
          ProfitPilot Pro Calculator
        </h1>
        <p className="text-gray-600">
          Calculate profits for your Shopify and eBay products with VAT and shipping costs
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Product Details
            </CardTitle>
            <CardDescription>
              Enter your product and shipping information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sellingPrice">Selling Price (£) - Inc VAT</Label>
              <Input
                id="sellingPrice"
                type="number"
                step="0.01"
                placeholder="29.99"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="costPrice">Cost Price (£)</Label>
              <div className="flex gap-2">
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  placeholder="15.00"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="flex-1"
                />
                <Select value={costIncludesVat ? "inc" : "exc"} onValueChange={(value) => setCostIncludesVat(value === "inc")}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inc">Inc VAT</SelectItem>
                    <SelectItem value="exc">Ex VAT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform">Select Platform</Label>
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose selling platform" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PLATFORMS).map(([key, platform]) => (
                    <SelectItem key={key} value={key}>
                      {platform.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="courier">Select Courier - Inc VAT</Label>
              <Select value={selectedCourier} onValueChange={setSelectedCourier}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose courier service" />
                </SelectTrigger>
                <SelectContent>
                  {COURIERS.map((courier) => (
                    <SelectItem key={courier.name} value={courier.name}>
                      {courier.name} - £{courier.cost.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vatRate">VAT Rate (%)</Label>
                <Input
                  id="vatRate"
                  type="number"
                  step="0.1"
                  placeholder="20"
                  value={vatRate}
                  onChange={(e) => setVatRate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetMargin">Target Margin (%)</Label>
                <Input
                  id="targetMargin"
                  type="number"
                  step="0.1"
                  placeholder="30"
                  value={targetMargin}
                  onChange={(e) => setTargetMargin(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={calculateProfit} className="flex-1">
                Calculate Profit
              </Button>
              <Button variant="outline" onClick={resetCalculator}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Profit Analysis</CardTitle>
            <CardDescription>
              Detailed breakdown of costs and profits
            </CardDescription>
          </CardHeader>
          <CardContent>
            {calculation ? (
              <div className="space-y-4">
                {calculation.isUnprofitable && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">
                      <strong>Unprofitable Product!</strong> This product doesn't meet your {calculation.targetMargin}% margin target.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Selling Price</p>
                    <p className="text-2xl font-bold">£{calculation.sellingPrice.toFixed(2)}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Total Costs</p>
                    <p className="text-2xl font-bold text-red-600">
                      £{((costIncludesVat ? calculation.costPrice - calculation.vatPaid : calculation.costPrice) + calculation.shippingCost + calculation.platformFees + calculation.vatToPay).toFixed(2)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Profit Amount</p>
                    <p className={`text-2xl font-bold ${calculation.profitAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      £{calculation.profitAmount.toFixed(2)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Profit Margin</p>
                    <div className="flex items-center gap-2">
                      <p className={`text-2xl font-bold ${calculation.profitMargin >= calculation.targetMargin ? 'text-green-600' : 'text-red-600'}`}>
                        {calculation.profitMargin.toFixed(1)}%
                      </p>
                      <Badge variant={calculation.profitMargin >= calculation.targetMargin ? "default" : "destructive"}>
                        {calculation.profitMargin >= calculation.targetMargin ? "Good" : "Low"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <h4 className="font-semibold text-gray-900">Cost Breakdown:</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Product Cost (Ex VAT):</span>
                      <span>£{(costIncludesVat ? calculation.costPrice - calculation.vatPaid : calculation.costPrice).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping Cost:</span>
                      <span>£{calculation.shippingCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{calculation.platform} Fees:</span>
                      <span>£{calculation.platformFees.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">VAT to Pay:</span>
                      <span>£{calculation.vatToPay.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <h4 className="font-semibold text-gray-900">VAT Breakdown:</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">VAT Claimed (Output VAT):</span>
                      <span className="text-green-600">£{calculation.vatClaimed.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">VAT Paid (Input VAT):</span>
                      <span className="text-red-600">£{calculation.vatPaid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1 font-semibold">
                      <span className="text-gray-900">Net VAT to Pay:</span>
                      <span className={calculation.vatToPay >= 0 ? "text-red-600" : "text-green-600"}>
                        £{calculation.vatToPay.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Calculation Steps:</h4>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Selling Price:</span>
                      <span className="font-mono">£{calculation.sellingPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">VAT Claimed (Sales):</span>
                      <span className="font-mono">£{calculation.sellingPrice.toFixed(2)} × {calculation.vatRate}% ÷ 120% = £{((calculation.sellingPrice * calculation.vatRate) / (100 + calculation.vatRate)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">VAT Claimed (Shipping):</span>
                      <span className="font-mono">£{calculation.shippingCost.toFixed(2)} × {calculation.vatRate}% ÷ 120% = £{((calculation.shippingCost * calculation.vatRate) / (100 + calculation.vatRate)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total VAT Claimed:</span>
                      <span className="font-mono">£{calculation.vatClaimed.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">VAT Paid (Cost):</span>
                      <span className="font-mono">{costIncludesVat ? `£${calculation.costPrice.toFixed(2)} × ${calculation.vatRate}% ÷ 120%` : `£${calculation.costPrice.toFixed(2)} × ${calculation.vatRate}%`} = £{calculation.vatPaid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Net VAT:</span>
                      <span className="font-mono">£{calculation.vatClaimed.toFixed(2)} - £{calculation.vatPaid.toFixed(2)} = £{calculation.vatToPay.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{calculation.platform} Fees:</span>
                      <span className="font-mono">£{calculation.platformFees.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Costs:</span>
                      <span className="font-mono">£{(costIncludesVat ? calculation.costPrice - calculation.vatPaid : calculation.costPrice).toFixed(2)} + £{calculation.shippingCost.toFixed(2)} + £{calculation.platformFees.toFixed(2)} + £{calculation.vatToPay.toFixed(2)} = £{((costIncludesVat ? calculation.costPrice - calculation.vatPaid : calculation.costPrice) + calculation.shippingCost + calculation.platformFees + calculation.vatToPay).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1">
                      <span className="text-gray-600">Profit:</span>
                      <span className="font-mono">£{calculation.sellingPrice.toFixed(2)} - £{((costIncludesVat ? calculation.costPrice - calculation.vatPaid : calculation.costPrice) + calculation.shippingCost + calculation.platformFees + calculation.vatToPay).toFixed(2)} = £{calculation.profitAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Margin:</span>
                      <span className="font-mono">(£{calculation.profitAmount.toFixed(2)} ÷ £{calculation.sellingPrice.toFixed(2)}) × 100 = {calculation.profitMargin.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>

                {calculation.isUnprofitable && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Suggested Pricing:</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      To achieve your {calculation.targetMargin}% margin target:
                    </p>
                    <p className="text-xl font-bold text-blue-600">
                      Suggested Price: £{calculation.suggestedPrice.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Enter product details and click "Calculate Profit" to see results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
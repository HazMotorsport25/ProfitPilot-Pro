"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertTriangle, Calculator, Package } from "lucide-react"

interface ProfitCalculation {
  sellingPrice: number
  costPrice: number
  shippingCost: number
  shippingCharged: number
  vatRate: number
  targetMargin: number
  platform: string
  platformFees: number
  profitAmount: number
  profitMargin: number
  isUnprofitable: boolean
  suggestedPrice: number
  vatOnExpenses: number
  vatOnSales: number
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
    finalValueFeeRate: 8.9, // Final value fee % (realistic)
    topRatedDiscount: 10, // Top-rated seller discount %
    regulatoryFeeRate: 0.35, // Regulatory operating fee %
    promotedListingsRate: 2.2, // Promoted listings ad rate %
    fixedFee: 0.30, // Per order fixed fee
    paypalRate: 0
  },
  shopify: {
    name: "Shopify",
    finalValueFeeRate: 3, // Transaction fee %
    topRatedDiscount: 0,
    regulatoryFeeRate: 0,
    promotedListingsRate: 0,
    fixedFee: 0,
    paypalRate: 0
  }
}

export default function ProfitCalculator() {
  const [sellingPrice, setSellingPrice] = useState<string>("")
  const [costPrice, setCostPrice] = useState<string>("")
  const [costIncludesVat, setCostIncludesVat] = useState<boolean>(true)
  const [selectedCourier, setSelectedCourier] = useState<string>("")
  const [shippingCharged, setShippingCharged] = useState<string>("")
  const [freeShipping, setFreeShipping] = useState<boolean>(false)
  const [selectedPlatform, setSelectedPlatform] = useState<string>("ebay")
  const [vatRate, setVatRate] = useState<string>("20")
  const [targetMargin, setTargetMargin] = useState<string>("30")
  const [topRatedSeller, setTopRatedSeller] = useState<boolean>(false)
  const [promotedListings, setPromotedListings] = useState<boolean>(false)
  const [calculation, setCalculation] = useState<ProfitCalculation | null>(null)

  const calculateProfit = () => {
    const selling = parseFloat(sellingPrice)
    const cost = parseFloat(costPrice)
    const courier = COURIERS.find(c => c.name === selectedCourier)
    const platform = PLATFORMS[selectedPlatform as keyof typeof PLATFORMS]
    const vat = parseFloat(vatRate)
    const target = parseFloat(targetMargin)
    const shippingChargedAmount = freeShipping ? 0 : parseFloat(shippingCharged) || 0

    if (!selling || !cost || !courier || !platform || !vat || !target) {
      return
    }

    const shippingCost = courier.cost // What seller pays courier
    
    // Calculate VAT breakdown
    const vatOnSalesAmount = (selling * vat) / (100 + vat) // VAT collected on product sales
    const vatOnShippingChargedAmount = (shippingChargedAmount * vat) / (100 + vat) // VAT collected on shipping charged to customer
    const vatOnSales = vatOnSalesAmount + vatOnShippingChargedAmount // Total VAT collected
    
    // Calculate VAT on expenses (what you can claim back)
    const vatOnCostExpenses = costIncludesVat 
      ? (cost * vat) / (100 + vat) // Extract VAT from inclusive price
      : (cost * vat) / 100 // Calculate VAT on exclusive price
    const vatOnShippingExpenses = (shippingCost * vat) / (100 + vat) // VAT paid on courier costs
    const vatOnExpenses = vatOnCostExpenses + vatOnShippingExpenses
    
    // Calculate platform fees using eBay's structure
    let platformFeesExVat = 0
    if (selectedPlatform === 'ebay') {
      // Final Value Fee
      let finalValueFee = (selling * platform.finalValueFeeRate / 100)
      
      // Top-rated seller discount (if applicable)
      if (topRatedSeller) {
        const discount = finalValueFee * (platform.topRatedDiscount / 100)
        finalValueFee -= discount
      }
      
      // Regulatory operating fee
      const regulatoryFee = selling * (platform.regulatoryFeeRate / 100)
      
      // Promoted listings fee (if applicable)
      const promotedListingsFee = promotedListings ? (selling * platform.promotedListingsRate / 100) : 0
      
      // Fixed fee per order
      const fixedFee = platform.fixedFee
      
      platformFeesExVat = finalValueFee + regulatoryFee + promotedListingsFee + fixedFee
    } else {
      // Shopify or other platforms use simple percentage
      platformFeesExVat = (selling * platform.finalValueFeeRate / 100) + platform.fixedFee
    }
    
    const vatOnPlatformFees = (platformFeesExVat * vat) / 100 // VAT added on top of the fee
    const platformFeesIncVat = platformFeesExVat + vatOnPlatformFees
    
    // Update VAT on expenses to include platform fees VAT
    const totalVatOnExpenses = vatOnExpenses + vatOnPlatformFees
    const vatToPay = vatOnSales - totalVatOnExpenses // Net VAT owed to HMRC
    
    // Use cost excluding VAT for total calculation (since VAT is handled separately)
    const costExVat = costIncludesVat ? cost - vatOnCostExpenses : cost
    const shippingCostExVat = shippingCost - vatOnShippingExpenses // Courier costs are Inc VAT, so exclude VAT for cost calculation
    const totalCosts = costExVat + shippingCostExVat + platformFeesExVat + vatToPay
    
    // Revenue should exclude VAT for profit calculation (VAT is not profit, it's collected for HMRC)
    const revenueExVat = selling - vatOnSalesAmount + (shippingChargedAmount - vatOnShippingChargedAmount)
    const profit = revenueExVat - totalCosts
    const margin = (profit / revenueExVat) * 100
    const isUnprofitable = margin < target
    
    // Calculate suggested price to meet target margin (accounting for VAT properly)
    const suggestedPrice = (cost + shippingCost + platformFeesExVat) / (1 - target/100 - (vat/(100+vat)) + (cost*vat/(100+vat))/selling)

    setCalculation({
      sellingPrice: selling,
      costPrice: cost,
      shippingCost: shippingCost,
      shippingCharged: shippingChargedAmount,
      vatRate: vat,
      targetMargin: target,
      platform: platform.name,
      platformFees: platformFeesExVat,
      profitAmount: profit,
      profitMargin: margin,
      isUnprofitable,
      suggestedPrice,
      vatOnExpenses: totalVatOnExpenses,
      vatOnSales,
      vatToPay
    })
  }

  const resetCalculator = () => {
    setSellingPrice("")
    setCostPrice("")
    setCostIncludesVat(true)
    setSelectedCourier("")
    setShippingCharged("")
    setFreeShipping(false)
    setSelectedPlatform("ebay")
    setVatRate("20")
    setTargetMargin("30")
    setTopRatedSeller(false)
    setPromotedListings(false)
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
              <Package className="w-5 h-5" />
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
              {selectedPlatform === 'ebay' && (
                <div className="space-y-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="topRatedSeller"
                      checked={topRatedSeller}
                      onCheckedChange={(checked) => setTopRatedSeller(checked as boolean)}
                    />
                    <Label htmlFor="topRatedSeller" className="text-sm font-normal">
                      Top-rated seller (10% discount on final value fee)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="promotedListings"
                      checked={promotedListings}
                      onCheckedChange={(checked) => setPromotedListings(checked as boolean)}
                    />
                    <Label htmlFor="promotedListings" className="text-sm font-normal">
                      Promoted listings (2.2% advertising fee)
                    </Label>
                  </div>
                </div>
              )}
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

            <div className="space-y-2">
              <Label htmlFor="shippingCharged">Shipping Charged to Customer (£) - Inc VAT</Label>
              <Input
                id="shippingCharged"
                type="number"
                step="0.01"
                placeholder="4.99"
                value={shippingCharged}
                onChange={(e) => setShippingCharged(e.target.value)}
                disabled={freeShipping}
              />
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="freeShipping"
                  checked={freeShipping}
                  onCheckedChange={(checked) => setFreeShipping(checked as boolean)}
                />
                <Label htmlFor="freeShipping" className="text-sm font-normal">
                  Free shipping (no charge to customer)
                </Label>
              </div>
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
                    <p className="text-sm font-medium text-gray-500">Revenue (Ex VAT)</p>
                    <p className="text-2xl font-bold text-green-600">£{(calculation.sellingPrice - calculation.vatOnSales + calculation.shippingCharged - ((calculation.shippingCharged * calculation.vatRate) / (100 + calculation.vatRate))).toFixed(2)}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Total Costs</p>
                    <p className="text-2xl font-bold text-red-600">
                      £{((costIncludesVat ? calculation.costPrice - calculation.vatOnExpenses : calculation.costPrice) + (calculation.shippingCost - ((calculation.shippingCost * calculation.vatRate) / (100 + calculation.vatRate))) + calculation.platformFees + calculation.vatToPay).toFixed(2)}
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
                      <span>£{(costIncludesVat ? calculation.costPrice - calculation.vatOnExpenses : calculation.costPrice).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping Cost (Ex VAT):</span>
                      <span>£{(calculation.shippingCost - ((calculation.shippingCost * calculation.vatRate) / (100 + calculation.vatRate))).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping Revenue:</span>
                      <span className="text-green-600">+£{calculation.shippingCharged.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{calculation.platform} Fees (Ex VAT):</span>
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
                      <span className="text-gray-600">VAT on Sales (Output VAT):</span>
                      <span className="text-red-600">£{calculation.vatOnSales.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">VAT on Expenses (Input VAT):</span>
                      <span className="text-green-600">£{calculation.vatOnExpenses.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1 font-semibold">
                      <span className="text-gray-900">Net VAT to Pay HMRC:</span>
                      <span className={calculation.vatToPay >= 0 ? "text-red-600" : "text-green-600"}>
                        £{calculation.vatToPay.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Detailed Calculation Breakdown</h4>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-4">
                    
                    {/* Revenue Section */}
                    <div>
                      <h5 className="font-semibold text-gray-800 mb-2 text-base">📈 Revenue Calculation</h5>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Selling Price (Inc VAT):</span>
                          <span className="font-mono">£{calculation.sellingPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">VAT on Sales:</span>
                          <span className="font-mono">£{calculation.sellingPrice.toFixed(2)} × {calculation.vatRate}% ÷ 120% = £{((calculation.sellingPrice * calculation.vatRate) / (100 + calculation.vatRate)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Shipping Charged to Customer:</span>
                          <span className="font-mono">£{calculation.shippingCharged.toFixed(2)}</span>
                        </div>
                        {calculation.shippingCharged > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">VAT on Shipping Charged:</span>
                            <span className="font-mono">£{calculation.shippingCharged.toFixed(2)} × {calculation.vatRate}% ÷ 120% = £{((calculation.shippingCharged * calculation.vatRate) / (100 + calculation.vatRate)).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t pt-1 font-medium">
                          <span className="text-gray-800">Revenue (Ex VAT):</span>
                          <span className="font-mono">£{(calculation.sellingPrice - calculation.vatOnSales + calculation.shippingCharged - ((calculation.shippingCharged * calculation.vatRate) / (100 + calculation.vatRate))).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Platform Fees Section */}
                    <div>
                      <h5 className="font-semibold text-gray-800 mb-2 text-base">🏪 {calculation.platform} Fees Breakdown</h5>
                      {selectedPlatform === 'ebay' ? (
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Final Value Fee (8.9%):</span>
                            <span className="font-mono">£{calculation.sellingPrice.toFixed(2)} × 8.9% = £{(calculation.sellingPrice * 8.9 / 100).toFixed(2)}</span>
                          </div>
                          {topRatedSeller && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Top-rated seller discount (10%):</span>
                              <span className="font-mono">£{(calculation.sellingPrice * 8.9 / 100).toFixed(2)} × 10% = -£{((calculation.sellingPrice * 8.9 / 100) * 0.1).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600">Regulatory operating fee (0.35%):</span>
                            <span className="font-mono">£{calculation.sellingPrice.toFixed(2)} × 0.35% = £{(calculation.sellingPrice * 0.35 / 100).toFixed(2)}</span>
                          </div>
                          {promotedListings && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Promoted listings fee (2.2%):</span>
                              <span className="font-mono">£{calculation.sellingPrice.toFixed(2)} × 2.2% = £{(calculation.sellingPrice * 2.2 / 100).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600">Fixed fee per order:</span>
                            <span className="font-mono">£0.30</span>
                          </div>
                          <div className="flex justify-between border-t pt-1 font-medium">
                            <span className="text-gray-800">Total eBay Fees (Ex VAT):</span>
                            <span className="font-mono">£{calculation.platformFees.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">VAT on Platform Fees (20%):</span>
                            <span className="font-mono">£{calculation.platformFees.toFixed(2)} × 20% = £{(calculation.platformFees * calculation.vatRate / 100).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-medium">
                            <span className="text-gray-800">Total eBay Fees (Inc VAT):</span>
                            <span className="font-mono">£{(calculation.platformFees + (calculation.platformFees * calculation.vatRate / 100)).toFixed(2)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-600">{calculation.platform} Transaction Fees:</span>
                            <span className="font-mono">£{calculation.platformFees.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* VAT Summary Section */}
                    <div>
                      <h5 className="font-semibold text-gray-800 mb-2 text-base">🧾 VAT Summary</h5>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">VAT on Sales (Output VAT):</span>
                          <span className="font-mono text-red-600">£{calculation.vatOnSales.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">VAT on Product Cost (Input VAT):</span>
                          <span className="font-mono text-green-600">£{(costIncludesVat ? (calculation.costPrice * calculation.vatRate) / (100 + calculation.vatRate) : (calculation.costPrice * calculation.vatRate) / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">VAT on Shipping Cost (Input VAT):</span>
                          <span className="font-mono text-green-600">£{((calculation.shippingCost * calculation.vatRate) / (100 + calculation.vatRate)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">VAT on Platform Fees (Input VAT):</span>
                          <span className="font-mono text-green-600">£{(calculation.platformFees * calculation.vatRate / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1 font-medium">
                          <span className="text-gray-800">Total Input VAT (Claimable):</span>
                          <span className="font-mono text-green-600">£{calculation.vatOnExpenses.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span className="text-gray-800">Net VAT to Pay HMRC:</span>
                          <span className={`font-mono ${calculation.vatToPay >= 0 ? "text-red-600" : "text-green-600"}`}>£{calculation.vatToPay.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Final Calculation Section */}
                    <div>
                      <h5 className="font-semibold text-gray-800 mb-2 text-base">💰 Profit Calculation</h5>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Revenue (Ex VAT):</span>
                          <span className="font-mono">£{(calculation.sellingPrice - calculation.vatOnSales + calculation.shippingCharged - ((calculation.shippingCharged * calculation.vatRate) / (100 + calculation.vatRate))).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Business Costs:</span>
                          <span className="font-mono">£{((costIncludesVat ? calculation.costPrice - calculation.vatOnExpenses : calculation.costPrice) + (calculation.shippingCost - ((calculation.shippingCost * calculation.vatRate) / (100 + calculation.vatRate))) + calculation.platformFees + calculation.vatToPay).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1 font-bold text-base">
                          <span className="text-gray-900">Net Profit:</span>
                          <span className={`font-mono ${calculation.profitAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>£{calculation.profitAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-base">
                          <span className="text-gray-900">Profit Margin:</span>
                          <span className={`font-mono ${calculation.profitMargin >= calculation.targetMargin ? 'text-green-600' : 'text-red-600'}`}>{calculation.profitMargin.toFixed(2)}%</span>
                        </div>
                      </div>
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
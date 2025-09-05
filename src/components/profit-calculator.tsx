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

const COUNTRIES = {
  UK: {
    name: "United Kingdom",
    currency: "£",
    currencyCode: "GBP",
    vatRate: 20,
    taxName: "VAT",
    couriers: [
      { name: "Royal Mail", cost: 4.00 },
      { name: "DPD", cost: 6.99 },
      { name: "Hermes/Evri", cost: 3.95 },
      { name: "DHL", cost: 8.50 },
      { name: "UPS", cost: 7.25 },
      { name: "Yodel", cost: 4.20 },
    ]
  },
  US: {
    name: "United States",
    currency: "$",
    currencyCode: "USD",
    vatRate: 8.5, // Average sales tax
    taxName: "Sales Tax",
    couriers: [
      { name: "USPS", cost: 5.50 },
      { name: "UPS", cost: 9.25 },
      { name: "FedEx", cost: 8.75 },
      { name: "DHL", cost: 12.00 },
    ]
  },
  CA: {
    name: "Canada",
    currency: "$",
    currencyCode: "CAD",
    vatRate: 13, // HST average
    taxName: "HST/GST",
    couriers: [
      { name: "Canada Post", cost: 8.50 },
      { name: "UPS", cost: 12.00 },
      { name: "FedEx", cost: 11.50 },
      { name: "Purolator", cost: 9.75 },
    ]
  },
  AU: {
    name: "Australia",
    currency: "$",
    currencyCode: "AUD",
    vatRate: 10,
    taxName: "GST",
    couriers: [
      { name: "Australia Post", cost: 9.50 },
      { name: "StarTrack", cost: 12.50 },
      { name: "TNT", cost: 11.00 },
      { name: "DHL", cost: 15.00 },
    ]
  },
  DE: {
    name: "Germany",
    currency: "€",
    currencyCode: "EUR",
    vatRate: 19,
    taxName: "MwSt",
    couriers: [
      { name: "Deutsche Post", cost: 4.95 },
      { name: "DHL", cost: 6.90 },
      { name: "UPS", cost: 8.50 },
      { name: "FedEx", cost: 9.25 },
    ]
  },
  FR: {
    name: "France",
    currency: "€",
    currencyCode: "EUR",
    vatRate: 20,
    taxName: "TVA",
    couriers: [
      { name: "La Poste", cost: 5.20 },
      { name: "Chronopost", cost: 8.90 },
      { name: "UPS", cost: 9.50 },
      { name: "DHL", cost: 7.80 },
    ]
  },
  ES: {
    name: "Spain",
    currency: "€",
    currencyCode: "EUR",
    vatRate: 21,
    taxName: "IVA",
    couriers: [
      { name: "Correos", cost: 4.50 },
      { name: "SEUR", cost: 7.20 },
      { name: "UPS", cost: 8.90 },
      { name: "DHL", cost: 7.50 },
    ]
  },
  IT: {
    name: "Italy",
    currency: "€",
    currencyCode: "EUR",
    vatRate: 22,
    taxName: "IVA",
    couriers: [
      { name: "Poste Italiane", cost: 5.10 },
      { name: "BRT", cost: 8.50 },
      { name: "UPS", cost: 9.20 },
      { name: "DHL", cost: 8.00 },
    ]
  }
}

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
    finalValueFeeRate: 1.7, // Shopify Payments fee %
    topRatedDiscount: 0,
    regulatoryFeeRate: 0,
    promotedListingsRate: 0,
    fixedFee: 0.25, // Shopify Payments fixed fee
    paypalRate: 0
  }
}

export default function ProfitCalculator() {
  const [sellingPrice, setSellingPrice] = useState<string>("")
  const [costPrice, setCostPrice] = useState<string>("")
  const [costIncludesVat, setCostIncludesVat] = useState<boolean>(true)
  const [selectedCountry, setSelectedCountry] = useState<string>("UK")
  const [selectedCourier, setSelectedCourier] = useState<string>("")
  const [shippingCharged, setShippingCharged] = useState<string>("")
  const [freeShipping, setFreeShipping] = useState<boolean>(false)
  const [selectedPlatform, setSelectedPlatform] = useState<string>("ebay")
  const [vatRate, setVatRate] = useState<string>("20")
  const [targetMargin, setTargetMargin] = useState<string>("30")
  const [topRatedSeller, setTopRatedSeller] = useState<boolean>(false)
  const [promotedListings, setPromotedListings] = useState<boolean>(false)
  const [calculation, setCalculation] = useState<ProfitCalculation | null>(null)
  
  const currentCountry = COUNTRIES[selectedCountry as keyof typeof COUNTRIES]

  const calculateProfit = () => {
    const selling = parseFloat(sellingPrice)
    const cost = parseFloat(costPrice)
    const courier = currentCountry.couriers.find(c => c.name === selectedCourier)
    const platform = PLATFORMS[selectedPlatform as keyof typeof PLATFORMS]
    const vat = currentCountry.vatRate // Use country-specific {currentCountry.taxName} rate
    const target = parseFloat(targetMargin)
    const shippingChargedAmount = freeShipping ? 0 : parseFloat(shippingCharged) || 0

    if (!selling || !cost || !courier || !platform || !target) {
      return
    }

    const shippingCost = courier.cost // What seller pays courier
    
    // Calculate {currentCountry.taxName} breakdown
    const vatOnSalesAmount = (selling * vat) / (100 + vat) // {currentCountry.taxName} collected on product sales
    const vatOnShippingChargedAmount = (shippingChargedAmount * vat) / (100 + vat) // {currentCountry.taxName} collected on shipping charged to customer
    const vatOnSales = vatOnSalesAmount + vatOnShippingChargedAmount // Total {currentCountry.taxName} collected
    
    // Calculate {currentCountry.taxName} on expenses (what you can claim back)
    const vatOnCostExpenses = costIncludesVat 
      ? (cost * vat) / (100 + vat) // Extract {currentCountry.taxName} from inclusive price
      : (cost * vat) / 100 // Calculate {currentCountry.taxName} on exclusive price
    const vatOnShippingExpenses = (shippingCost * vat) / (100 + vat) // {currentCountry.taxName} paid on courier costs
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
    
    // {currentCountry.taxName} on platform fees - only eBay charges {currentCountry.taxName}, Shopify doesn't
    const vatOnPlatformFees = selectedPlatform === 'ebay' ? (platformFeesExVat * vat) / 100 : 0
    const platformFeesIncVat = platformFeesExVat + vatOnPlatformFees
    
    // Update {currentCountry.taxName} on expenses to include platform fees {currentCountry.taxName} (only if applicable)
    const totalVatOnExpenses = vatOnExpenses + vatOnPlatformFees
    const vatToPay = vatOnSales - totalVatOnExpenses // Net {currentCountry.taxName} owed to Tax Authority
    
    // Use cost excluding {currentCountry.taxName} for total calculation (since {currentCountry.taxName} is handled separately)
    const costExVat = costIncludesVat ? cost - vatOnCostExpenses : cost
    const shippingCostExVat = shippingCost - vatOnShippingExpenses // Courier costs are Inc {currentCountry.taxName}, so exclude {currentCountry.taxName} for cost calculation
    const totalCosts = costExVat + shippingCostExVat + platformFeesExVat + vatToPay
    
    // Revenue should exclude {currentCountry.taxName} for profit calculation ({currentCountry.taxName} is not profit, it's collected for Tax Authority)
    const revenueExVat = selling - vatOnSalesAmount + (shippingChargedAmount - vatOnShippingChargedAmount)
    const profit = revenueExVat - totalCosts
    const margin = (profit / revenueExVat) * 100
    const isUnprofitable = margin < target
    
    // Calculate suggested price to meet target margin
    // If current margin matches target (within 0.1%), return current price to avoid rounding errors
    let suggestedPrice
    if (Math.abs(margin - target) < 0.1) {
      suggestedPrice = selling
    } else {
      // Simple approximation: Required Revenue = Total Costs / (1 - target margin)
      // Then convert back to selling price including tax
      const requiredRevenueExVat = totalCosts / (1 - target/100)
      suggestedPrice = requiredRevenueExVat * (1 + vat/100)
    }

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
    setSelectedCountry("UK")
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

  // Update {currentCountry.taxName} rate when country changes
  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode)
    const country = COUNTRIES[countryCode as keyof typeof COUNTRIES]
    setVatRate(country.vatRate.toString())
    setSelectedCourier("") // Reset courier selection
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          <Calculator className="w-8 h-8 text-blue-600" />
          ProfitPilot Pro Calculator
        </h1>
        <p className="text-gray-600">
          International profit calculator for Shopify and eBay products with tax and shipping costs
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
              <Label htmlFor="country">Country/Region</Label>
              <Select value={selectedCountry} onValueChange={handleCountryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your country" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(COUNTRIES).map(([key, country]) => (
                    <SelectItem key={key} value={key}>
                      {country.name} ({country.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellingPrice">Selling Price ({currentCountry.currency}) - Inc {currentCountry.taxName}</Label>
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
              <Label htmlFor="costPrice">Cost Price ({currentCountry.currency})</Label>
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
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inc">Inc {currentCountry.taxName}</SelectItem>
                    <SelectItem value="exc">Ex {currentCountry.taxName}</SelectItem>
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
              <Label htmlFor="courier">Select Courier - Inc {currentCountry.taxName}</Label>
              <Select value={selectedCourier} onValueChange={setSelectedCourier}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose courier service" />
                </SelectTrigger>
                <SelectContent>
                  {currentCountry.couriers.map((courier) => (
                    <SelectItem key={courier.name} value={courier.name}>
                      {courier.name} - {currentCountry.currency}{courier.cost.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shippingCharged">Shipping Charged to Customer ({currentCountry.currency}) - Inc {currentCountry.taxName}</Label>
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
                <Label htmlFor="vatRate">{currentCountry.taxName} Rate (%)</Label>
                <Input
                  id="vatRate"
                  type="number"
                  step="0.1"
                  placeholder={currentCountry.vatRate.toString()}
                  value={vatRate}
                  onChange={(e) => setVatRate(e.target.value)}
                  disabled
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
                    <p className="text-sm font-medium text-gray-500">Revenue (Ex {currentCountry.taxName})</p>
                    <p className="text-2xl font-bold text-green-600">{currentCountry.currency}{(calculation.sellingPrice - calculation.vatOnSales + calculation.shippingCharged - ((calculation.shippingCharged * calculation.vatRate) / (100 + calculation.vatRate))).toFixed(2)}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Total Costs</p>
                    <p className="text-2xl font-bold text-red-600">
                      {currentCountry.currency}{((costIncludesVat ? calculation.costPrice - calculation.vatOnExpenses : calculation.costPrice) + (calculation.shippingCost - ((calculation.shippingCost * calculation.vatRate) / (100 + calculation.vatRate))) + calculation.platformFees + calculation.vatToPay).toFixed(2)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Profit Amount</p>
                    <p className={`text-2xl font-bold ${calculation.profitAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {currentCountry.currency}{calculation.profitAmount.toFixed(2)}
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
                      <span className="text-gray-600">Product Cost (Ex {currentCountry.taxName}):</span>
                      <span>{currentCountry.currency}{(costIncludesVat ? calculation.costPrice - calculation.vatOnExpenses : calculation.costPrice).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping Cost (Ex {currentCountry.taxName}):</span>
                      <span>{currentCountry.currency}{(calculation.shippingCost - ((calculation.shippingCost * calculation.vatRate) / (100 + calculation.vatRate))).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping Revenue:</span>
                      <span className="text-green-600">+{currentCountry.currency}{calculation.shippingCharged.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{calculation.platform} Fees (Ex {currentCountry.taxName}):</span>
                      <span>{currentCountry.currency}{calculation.platformFees.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{currentCountry.taxName} to Pay:</span>
                      <span>{currentCountry.currency}{calculation.vatToPay.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <h4 className="font-semibold text-gray-900">{currentCountry.taxName} Breakdown:</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{currentCountry.taxName} on Sales (Output {currentCountry.taxName}):</span>
                      <span className="text-red-600">{currentCountry.currency}{calculation.vatOnSales.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{currentCountry.taxName} on Expenses (Input {currentCountry.taxName}):</span>
                      <span className="text-green-600">{currentCountry.currency}{calculation.vatOnExpenses.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1 font-semibold">
                      <span className="text-gray-900">Net {currentCountry.taxName} to Pay Tax Authority:</span>
                      <span className={calculation.vatToPay >= 0 ? "text-red-600" : "text-green-600"}>
                        {currentCountry.currency}{calculation.vatToPay.toFixed(2)}
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
                          <span className="text-gray-600">Selling Price (Inc {currentCountry.taxName}):</span>
                          <span className="font-mono">{currentCountry.currency}{calculation.sellingPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">{currentCountry.taxName} on Sales:</span>
                          <span className="font-mono">{currentCountry.currency}{calculation.sellingPrice.toFixed(2)} × {calculation.vatRate}% ÷ {100 + calculation.vatRate}% = {currentCountry.currency}{((calculation.sellingPrice * calculation.vatRate) / (100 + calculation.vatRate)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Shipping Charged to Customer:</span>
                          <span className="font-mono">{currentCountry.currency}{calculation.shippingCharged.toFixed(2)}</span>
                        </div>
                        {calculation.shippingCharged > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">{currentCountry.taxName} on Shipping Charged:</span>
                            <span className="font-mono">{currentCountry.currency}{calculation.shippingCharged.toFixed(2)} × {calculation.vatRate}% ÷ {100 + calculation.vatRate}% = {currentCountry.currency}{((calculation.shippingCharged * calculation.vatRate) / (100 + calculation.vatRate)).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t pt-1 font-medium">
                          <span className="text-gray-800">Revenue (Ex {currentCountry.taxName}):</span>
                          <span className="font-mono">{currentCountry.currency}{(calculation.sellingPrice - calculation.vatOnSales + calculation.shippingCharged - ((calculation.shippingCharged * calculation.vatRate) / (100 + calculation.vatRate))).toFixed(2)}</span>
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
                            <span className="font-mono">{currentCountry.currency}{calculation.sellingPrice.toFixed(2)} × 8.9% = {currentCountry.currency}{(calculation.sellingPrice * 8.9 / 100).toFixed(2)}</span>
                          </div>
                          {topRatedSeller && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Top-rated seller discount (10%):</span>
                              <span className="font-mono">{currentCountry.currency}{(calculation.sellingPrice * 8.9 / 100).toFixed(2)} × 10% = -{currentCountry.currency}{((calculation.sellingPrice * 8.9 / 100) * 0.1).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600">Regulatory operating fee (0.35%):</span>
                            <span className="font-mono">{currentCountry.currency}{calculation.sellingPrice.toFixed(2)} × 0.35% = {currentCountry.currency}{(calculation.sellingPrice * 0.35 / 100).toFixed(2)}</span>
                          </div>
                          {promotedListings && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Promoted listings fee (2.2%):</span>
                              <span className="font-mono">{currentCountry.currency}{calculation.sellingPrice.toFixed(2)} × 2.2% = {currentCountry.currency}{(calculation.sellingPrice * 2.2 / 100).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600">Fixed fee per order:</span>
                            <span className="font-mono">{currentCountry.currency}0.30</span>
                          </div>
                          <div className="flex justify-between border-t pt-1 font-medium">
                            <span className="text-gray-800">Total eBay Fees (Ex {currentCountry.taxName}):</span>
                            <span className="font-mono">{currentCountry.currency}{calculation.platformFees.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">{currentCountry.taxName} on Platform Fees (20%):</span>
                            <span className="font-mono">{currentCountry.currency}{calculation.platformFees.toFixed(2)} × 20% = {currentCountry.currency}{(calculation.platformFees * calculation.vatRate / 100).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-medium">
                            <span className="text-gray-800">Total eBay Fees (Inc {currentCountry.taxName}):</span>
                            <span className="font-mono">{currentCountry.currency}{(calculation.platformFees + (calculation.platformFees * calculation.vatRate / 100)).toFixed(2)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Shopify Payments fee (1.7%):</span>
                            <span className="font-mono">{currentCountry.currency}{calculation.sellingPrice.toFixed(2)} × 1.7% = {currentCountry.currency}{(calculation.sellingPrice * 1.7 / 100).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Shopify Payments fixed fee:</span>
                            <span className="font-mono">{currentCountry.currency}0.25</span>
                          </div>
                          <div className="flex justify-between border-t pt-1 font-medium">
                            <span className="text-gray-800">Total Shopify Fees (No {currentCountry.taxName}):</span>
                            <span className="font-mono">{currentCountry.currency}{calculation.platformFees.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-500">
                            <span>Note: Shopify doesn't charge {currentCountry.taxName} on platform fees</span>
                            <span></span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* {currentCountry.taxName} Summary Section */}
                    <div>
                      <h5 className="font-semibold text-gray-800 mb-2 text-base">🧾 {currentCountry.taxName} Summary</h5>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">{currentCountry.taxName} on Sales (Output {currentCountry.taxName}):</span>
                          <span className="font-mono text-red-600">{currentCountry.currency}{calculation.vatOnSales.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">{currentCountry.taxName} on Product Cost (Input {currentCountry.taxName}):</span>
                          <span className="font-mono text-green-600">{currentCountry.currency}{(costIncludesVat ? (calculation.costPrice * calculation.vatRate) / (100 + calculation.vatRate) : (calculation.costPrice * calculation.vatRate) / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">{currentCountry.taxName} on Shipping Cost (Input {currentCountry.taxName}):</span>
                          <span className="font-mono text-green-600">{currentCountry.currency}{((calculation.shippingCost * calculation.vatRate) / (100 + calculation.vatRate)).toFixed(2)}</span>
                        </div>
                        {selectedPlatform === 'ebay' && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">{currentCountry.taxName} on Platform Fees (Input {currentCountry.taxName}):</span>
                            <span className="font-mono text-green-600">{currentCountry.currency}{(calculation.platformFees * calculation.vatRate / 100).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t pt-1 font-medium">
                          <span className="text-gray-800">Total Input {currentCountry.taxName} (Claimable):</span>
                          <span className="font-mono text-green-600">{currentCountry.currency}{calculation.vatOnExpenses.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span className="text-gray-800">Net {currentCountry.taxName} to Pay Tax Authority:</span>
                          <span className={`font-mono ${calculation.vatToPay >= 0 ? "text-red-600" : "text-green-600"}`}>{currentCountry.currency}{calculation.vatToPay.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Final Calculation Section */}
                    <div>
                      <h5 className="font-semibold text-gray-800 mb-2 text-base">💰 Profit Calculation</h5>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Revenue (Ex {currentCountry.taxName}):</span>
                          <span className="font-mono">{currentCountry.currency}{(calculation.sellingPrice - calculation.vatOnSales + calculation.shippingCharged - ((calculation.shippingCharged * calculation.vatRate) / (100 + calculation.vatRate))).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Business Costs:</span>
                          <span className="font-mono">{currentCountry.currency}{((costIncludesVat ? calculation.costPrice - calculation.vatOnExpenses : calculation.costPrice) + (calculation.shippingCost - ((calculation.shippingCost * calculation.vatRate) / (100 + calculation.vatRate))) + calculation.platformFees + calculation.vatToPay).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1 font-bold text-base">
                          <span className="text-gray-900">Net Profit:</span>
                          <span className={`font-mono ${calculation.profitAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>{currentCountry.currency}{calculation.profitAmount.toFixed(2)}</span>
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
                      Suggested Price: {currentCountry.currency}{calculation.suggestedPrice.toFixed(2)}
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
package demo; public class FakePricing implements Pricing { public Money price(String sku) { return new Money(100); } }

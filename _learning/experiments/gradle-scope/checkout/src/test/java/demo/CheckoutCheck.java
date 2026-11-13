package demo; class CheckoutCheck { long run() { return new Checkout().total(new FakePricing()); } }

import java.util.concurrent.atomic.AtomicInteger;

class SharedCounter {
    public static void main(String[] args) {
        // Replay one possible order for two callers, without depending on thread timing.
        AtomicInteger counter = new AtomicInteger(7);
        int firstRead = counter.get();
        int secondRead = counter.get();
        counter.set(firstRead + 1);
        counter.set(secondRead + 1);
        System.out.println("Separate reads and writes: " + counter.get());
        if (counter.get() != 8) throw new AssertionError("Expected one lost increment");

        counter.set(7);
        boolean firstSaved = counter.compareAndSet(firstRead, firstRead + 1);
        boolean secondSaved = counter.compareAndSet(secondRead, secondRead + 1);
        System.out.printf("Conditional writes: %s, %s; value %d%n",
                firstSaved, secondSaved, counter.get());
        if (!firstSaved || secondSaved) throw new AssertionError("Expected one stale writer");

        // The outstanding instruction is to add one to the current total.
        int result = counter.incrementAndGet();
        System.out.println("After completing the outstanding increment: " + result);
        if (result != 9) throw new AssertionError("Expected both increments");
    }
}

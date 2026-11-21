import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.CountDownLatch;

class SlowRequest {
    private static final Object monitor = new Object();
    private static final CountDownLatch ready = new CountDownLatch(1);
    private static final CountDownLatch release = new CountDownLatch(1);

    public static void main(String[] args) throws Exception {
        if ((args.length < 1 || args.length > 2) || !("lock".equals(args[0]) || "pool".equals(args[0]))) {
            throw new IllegalArgumentException("Choose lock or pool");
        }
        boolean lock = "lock".equals(args[0]);
        int slots = args.length == 2 ? Integer.parseInt(args[1]) : 1;
        if (slots < 1 || slots > 2) throw new IllegalArgumentException("Choose one or two slots");
        var connections = new ArrayBlockingQueue<Integer>(slots);
        for (int i = 1; i <= slots; i++) connections.add(i);
        Thread owner = Thread.ofPlatform().name("owner").start(() -> {
            if (lock) {
                synchronized (monitor) {
                    holdUntilReleased();
                }
            } else {
                int borrowed = connections.remove();
                try {
                    holdUntilReleased();
                } finally {
                    connections.add(borrowed);
                }
            }
        });
        ready.await();
        Thread request = Thread.ofPlatform().name("request").start(() -> {
            if (lock) {
                synchronized (monitor) {
                    System.out.println("request completed");
                }
            } else {
                try {
                    int borrowed = connections.take();
                    connections.add(borrowed);
                    System.out.println("request completed");
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
        });
        Thread.State waiting = lock ? Thread.State.BLOCKED : Thread.State.WAITING;
        while (request.isAlive() && request.getState() != waiting) Thread.sleep(5);
        System.out.printf("PID %d | available slots: %d | capture the dump, then press Enter%n",
                ProcessHandle.current().pid(), connections.size());
        try {
            System.in.read();
        } finally {
            release.countDown();
        }
        owner.join();
        request.join();
    }

    private static void holdUntilReleased() {
        ready.countDown();
        try {
            release.await();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}

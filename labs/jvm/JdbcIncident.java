import org.h2.jdbcx.JdbcConnectionPool;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.concurrent.FutureTask;
import java.util.concurrent.TimeUnit;

class JdbcIncident {
    private static final Object reportLock = new Object();

    public static void main(String[] args) throws Exception {
        if (args.length != 2 || !("A".equals(args[0]) || "B".equals(args[0]))
                || !("1".equals(args[1]) || "2".equals(args[1]))) {
            throw new IllegalArgumentException("Usage: JdbcIncident.java A|B 1|2");
        }
        boolean sharedMonitor = "B".equals(args[0]);
        int capacity = Integer.parseInt(args[1]);
        var pool = JdbcConnectionPool.create("jdbc:h2:mem:incident", "sa", "");
        pool.setMaxConnections(capacity);
        pool.setLoginTimeout(15);
        var request = new FutureTask<Integer>(() -> {
            if (sharedMonitor) {
                synchronized (reportLock) {
                    return readTotal(pool);
                }
            }
            return readTotal(pool);
        });
        try {
            synchronized (reportLock) {
                try (Connection owner = pool.getConnection(); Statement setup = owner.createStatement()) {
                    setup.execute("CREATE TABLE receipt(amount INT)");
                    setup.executeUpdate("INSERT INTO receipt VALUES (7), (11)");
                    var worker = Thread.ofPlatform().daemon().name("report-request").start(request);
                    capture(worker, request, pool);
                }
            }
            int total = request.get(5, TimeUnit.SECONDS);
            System.out.printf("After release: total=%d, borrowed=%d%n", total, pool.getActiveConnections());
            if (total != 18 || pool.getActiveConnections() != 0) throw new AssertionError("Recovery failed");
        } finally {
            pool.dispose();
        }
    }

    private static int readTotal(JdbcConnectionPool pool) throws Exception {
        try (Connection c = pool.getConnection();
             Statement query = c.createStatement();
             ResultSet rows = query.executeQuery("SELECT SUM(amount) FROM receipt")) {
            rows.next();
            return rows.getInt(1);
        }
    }

    private static void capture(Thread worker, FutureTask<Integer> request, JdbcConnectionPool pool)
            throws Exception {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(5);
        while (System.nanoTime() < deadline) {
            if (request.isDone()) {
                System.out.println("Before release: total=" + request.get());
                return;
            }
            var info = java.lang.management.ManagementFactory.getThreadMXBean()
                    .getThreadInfo(worker.threadId(), 24);
            if (info != null) {
                boolean waitingForPool = java.util.Arrays.stream(info.getStackTrace())
                        .anyMatch(frame -> frame.getClassName().equals(JdbcConnectionPool.class.getName())
                                && frame.getMethodName().equals("getConnection"));
                boolean waitingForOwner = info.getThreadState() == Thread.State.BLOCKED
                        && info.getLockOwnerId() == Thread.currentThread().threadId();
                if ((waitingForPool && info.getThreadState() == Thread.State.TIMED_WAITING) || waitingForOwner) {
                    System.out.printf("Before release: borrowed=%d, maximum=%d%n",
                            pool.getActiveConnections(), pool.getMaxConnections());
                    System.out.println(info);
                    return;
                }
            }
            Thread.sleep(2);
        }
        throw new AssertionError("No diagnostic sample within five seconds");
    }
}

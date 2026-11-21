import org.h2.jdbcx.JdbcConnectionPool;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

class RowWait {
    public static void main(String[] args) throws SQLException {
        if (args.length != 1 || !("commit".equals(args[0]) || "rollback".equals(args[0]))) {
            throw new IllegalArgumentException("Choose commit or rollback");
        }
        var pool = JdbcConnectionPool.create("jdbc:h2:mem:rowwait;LOCK_TIMEOUT=300", "sa", "");
        pool.setMaxConnections(2);
        try (Connection first = pool.getConnection(); Connection second = pool.getConnection();
             Statement owner = first.createStatement(); Statement peer = second.createStatement()) {
            owner.execute("CREATE TABLE seat(id INT PRIMARY KEY, revision INT)");
            owner.executeUpdate("INSERT INTO seat VALUES(1, 1), (2, 1)");
            first.setAutoCommit(false);
            try {
                owner.executeUpdate("UPDATE seat SET revision=2 WHERE id=1");
                System.out.printf("Borrowed=%d; peer sees revision=%d%n",
                        pool.getActiveConnections(), revision(peer));
                peer.executeUpdate("UPDATE seat SET revision=2 WHERE id=2");
                try {
                    edit(peer);
                    throw new AssertionError("Expected lock timeout on seat 1");
                } catch (SQLException e) {
                    if (e.getErrorCode() != 50200) throw e;
                    System.out.println("Same-row update timed out; other-row update committed");
                }
                if ("commit".equals(args[0])) first.commit();
                else first.rollback();
                int changed = edit(peer);
                int actual = revision(peer);
                System.out.printf("Retry: affected=%d, revision=%d%n", changed, actual);
                if ("commit".equals(args[0]) ? changed != 0 || actual != 2 : changed != 1 || actual != 3)
                    throw new AssertionError("Unexpected retry result");
            } finally {
                first.rollback();
            }
        } finally {
            pool.dispose();
        }
    }

    private static int edit(Statement peer) throws SQLException {
        return peer.executeUpdate("UPDATE seat SET revision=3 WHERE id=1 AND revision=1");
    }

    private static int revision(Statement peer) throws SQLException {
        try (var rows = peer.executeQuery("SELECT revision FROM seat WHERE id=1")) {
            rows.next();
            return rows.getInt(1);
        }
    }
}

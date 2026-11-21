import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.util.concurrent.Executors;
import java.util.regex.Pattern;

class Parking {
    record Reply(int status, String body) {}
    static final Pattern PATH = Pattern.compile("/sessions/([a-z0-9-]{1,48})");

    public static void main(String[] args) throws Exception {
        if (args.length != 1) throw new IllegalArgumentException("Pass a local database file path");
        String url = "jdbc:h2:file:" + args[0];
        try (var db = DriverManager.getConnection(url); var sql = db.createStatement()) {
            sql.execute("CREATE TABLE IF NOT EXISTS lot(name VARCHAR PRIMARY KEY, free INT NOT NULL CHECK(free >= 0))");
            sql.execute("CREATE TABLE IF NOT EXISTS parking_session(id VARCHAR PRIMARY KEY, lot VARCHAR NOT NULL REFERENCES lot(name))");
            for (String name : new String[]{"west","east"}) {
                try (var seed = db.prepareStatement("INSERT INTO lot SELECT ?, 1 WHERE NOT EXISTS (SELECT 1 FROM lot WHERE name=?)")) {
                    seed.setString(1, name);
                    seed.setString(2, name);
                    seed.executeUpdate();
                }
            }
        }
        var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
        server.createContext("/", exchange -> {
            try (exchange) {
                Reply reply;
                try { reply = handle(url, exchange); }
                catch (SQLException failed) {
                    System.err.println("Database error " + failed.getSQLState());
                    reply = new Reply(503, "temporarily unavailable");
                }
                byte[] body = reply.body().getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().set("Content-Type", "text/plain; charset=utf-8");
                exchange.sendResponseHeaders(reply.status(), body.length);
                exchange.getResponseBody().write(body);
            }
        });
        server.start();
        System.out.println("PORT " + server.getAddress().getPort());
    }

    static Reply handle(String url, HttpExchange exchange) throws IOException, SQLException {
        var path = PATH.matcher(exchange.getRequestURI().getPath());
        if (!path.matches()) return new Reply(404, "unknown path");
        String id = path.group(1);
        try (var db = DriverManager.getConnection(url)) {
            if (exchange.getRequestMethod().equals("GET")) {
                String lot = lookup(db, id);
                return lot == null ? new Reply(404, "missing") : new Reply(200, lot);
            }
            if (!exchange.getRequestMethod().equals("PUT")) {
                exchange.getResponseHeaders().set("Allow", "GET, PUT");
                return new Reply(405, "unsupported method");
            }
            String lot = new String(exchange.getRequestBody().readNBytes(5), StandardCharsets.UTF_8);
            if (!lot.equals("west") && !lot.equals("east")) return new Reply(400, "choose west or east");
            return reserve(db, id, lot);
        }
    }

    static String lookup(Connection db, String id) throws SQLException {
        try (var read = db.prepareStatement("SELECT lot FROM parking_session WHERE id=?")) {
            read.setString(1, id);
            try (var rows = read.executeQuery()) { return rows.next() ? rows.getString(1) : null; }
        }
    }

    static Reply reserve(Connection db, String id, String lot) throws SQLException {
        db.setAutoCommit(false);
        try (var insert = db.prepareStatement("INSERT INTO parking_session VALUES (?, ?)");
             var take = db.prepareStatement("UPDATE lot SET free=free-1 WHERE name=? AND free>0")) {
            insert.setString(1, id);
            insert.setString(2, lot);
            try { insert.executeUpdate(); }
            catch (SQLException duplicate) {
                db.rollback();
                if (!"23505".equals(duplicate.getSQLState())) throw duplicate;
                return lot.equals(lookup(db, id)) ? new Reply(200, lot) : new Reply(409, "id already used");
            }
            take.setString(1, lot);
            if (take.executeUpdate() == 0) {
                db.rollback();
                return new Reply(409, "full");
            }
            db.commit();
            return new Reply(201, lot);
        } catch (SQLException failed) {
            db.rollback();
            throw failed;
        }
    }
}

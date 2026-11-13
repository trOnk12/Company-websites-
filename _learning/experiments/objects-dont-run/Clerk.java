// An object doesn't "live on" a thread: each call runs on whichever thread makes it.
import java.util.concurrent.*;

public class Clerk {
    private int stamped = 0;

    String stamp(String form) {
        stamped++;
        return form + " stamped on thread '" + Thread.currentThread().getName() + "'";
    }

    public static void main(String[] args) throws Exception {
        Clerk clerk = new Clerk();                       // created on main
        System.out.println(clerk.stamp("A"));            // called from main → runs on main

        Thread bob = new Thread(() -> System.out.println(clerk.stamp("B")), "bob");
        bob.start(); bob.join();                         // same object, called from bob → runs on bob

        // "Asking" a thread to run it: put the work in its queue (what Handler.post does with a Looper).
        ExecutorService mia = Executors.newSingleThreadExecutor(r -> new Thread(r, "mia"));
        System.out.println(mia.submit(() -> clerk.stamp("C")).get());
        mia.shutdown();
    }
}

public final class Bookmark {
    static final class Counter {
        int value;
        Counter(int value) { this.value = value; }
    }

    static int increment(int value) {
        return value + 1;
    }

    static void edit(Counter inside) {
        inside.value = 8;
        inside = new Counter(99);
    }

    public static void main(String[] args) {
        int original = 7;
        Counter first = new Counter(original);
        Counter second = first;
        edit(second);
        System.out.println(original + " " + increment(original));
        System.out.println(first.value + " " + second.value);
        second = null;
        System.out.println(first.value);
    }
}

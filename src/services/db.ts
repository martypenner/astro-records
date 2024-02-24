import { createStore } from "tinybase";

export const store = createStore()
  .setValue("counter", 0)
  .setRow("pets", "0", { name: "fido", species: "dog" })
  .setTable("species", {
    dog: { price: 5 },
    cat: { price: 4 },
    fish: { price: 2 },
    worm: { price: 1 },
    parrot: { price: 3 },
  });

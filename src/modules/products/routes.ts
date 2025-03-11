import { Hono } from "hono";

export const productsRoutes = new Hono();

productsRoutes.post("", (c) => {
  return c.text("Product created");
});

productsRoutes.get("/:id", (c) => {
  return c.text("Product found");
});

productsRoutes.patch("/:id", (c) => {
  return c.text("Product updated");
});

productsRoutes.delete("/:id", (c) => {
  return c.text("Product deleted");
});

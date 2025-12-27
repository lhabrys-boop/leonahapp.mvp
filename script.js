const bigL = document.getElementById("bigL");
const extendedL = document.getElementById("extendedL");

bigL.addEventListener("click", () => {
  const img = bigL.querySelector("img");

  // smanji i nestani
  img.style.transform = "scale(0.1)";
  img.style.opacity = "0";

  // nakon 1 sekunde sakrij bigL i pokaži extendedL
  setTimeout(() => {
    bigL.style.display = "none";
    extendedL.style.display = "block";
  }, 1000);
});
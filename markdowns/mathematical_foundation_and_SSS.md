# **Learning Note: Modular Arithmetic, Finite Fields, and Shamir’s Secret Sharing**

This note explains the **mathematical foundation** behind using **mod a large prime** in cryptographic schemes like **Shamir’s Secret Sharing (SSS)**, and why **plain integer polynomials** are insecure.

------

# **1️⃣ What is Finite (Modular) Arithmetic?**

In **finite arithmetic**, numbers **wrap around** when they reach a limit, defined by a **modulus**.

- Think of it like a **clock**:

  - On a 12-hour clock, `14 o’clock` is shown as `2 o’clock`.

  - Mathematically:
    $$
    14 \mod 12 = 2
    $$

- In cryptography, we use a **large prime modulus `p`** to fold numbers into **0 … p-1**.

Example (mod 7):

```structured text
0 1 2 3 4 5 6
7 → 0
8 → 1
13 → 6
```

This is called **finite field arithmetic**.

------

# **2️⃣ Visualizing Folding**

Imagine we have **polynomial values** that keep growing as x increases:

- Polynomial: f(x) = 12 + 4x + 5x²
- Modulus p = 7 (for a toy example)

Compute values **without mod**:

```structured text
x=0 → 12
x=1 → 21
x=2 → 40
x=3 → 69
x=4 → 108
```

Apply **mod 7 (folding)**:

```structured text
12 mod 7 = 5
21 mod 7 = 0
40 mod 7 = 5
69 mod 7 = 6
108 mod 7 = 3
```

So the sequence **wraps around**:

```structured text
Original: 12, 21, 40, 69, 108
Modulo 7:  5,  0,  5,  6,   3
```

### **Mermaid Visual: Folding**

```mermaid
graph LR
    A[12] --> B[5]
    C[21] --> D[0]
    E[40] --> F[5]
    G[69] --> H[6]
    I[108] --> J[3]
    classDef fold fill:#f9f,stroke:#333,stroke-width:1px
```

The numbers **“fold” into a circle** (finite field).
 This is what prevents values from **growing infinitely**.

------

# **3️⃣ Why Use a Prime Modulus?**

**Key reason:** To form a **Finite Field (𝔽ₚ)** where **division works**.

- Lagrange interpolation needs to **divide by (xᵢ - xⱼ)**.
- In modular arithmetic, **division = multiplication by modular inverse**.

**Modular inverse exists only if:**
$$
gcd(number, modulus) = 1
$$

- Using a **prime modulus** guarantees that **every non-zero number has an inverse**.

### **Example:**

- Mod 7 (prime):

  ```structured text
  3⁻¹ mod 7 = 5  (because 3*5 = 15 ≡ 1 mod 7)
  ```

  ✅ Always works for 1…6.

- Mod 8 (not prime):

  ```structured text
  2 has no inverse mod 8
  (2*x is always even, never ≡ 1 mod 8)
  ```

  ❌ Interpolation would fail.

------

# **4️⃣ Why Folding is Crucial for Shamir**

1. **Keeps numbers bounded**
   - Polynomials can grow huge.
   - Mod reduces them to a **fixed range (0…p-1)**.
2. **Ensures secrecy**
   - Shares look **random**, not sequential.
3. **Ensures math works**
   - Lagrange interpolation uses division → requires modular inverse → needs a **prime field**.

------

# **5️⃣ Intuitive Story**

- Imagine **pouring water into a circular tank** with capacity **p liters**.
- Whenever it overflows, it wraps around (like clock arithmetic).
- Lagrange interpolation is like **mixing multiple colored waters** at different clock positions to recover the secret color at x=0.
- The **prime number tank** ensures that **mixing is reversible**, so we can always reconstruct the original secret.



## 1️⃣ **What Does “mod a Large Prime” Mean?**

### **Definition of Modular Arithmetic**

- **Modular arithmetic** is a system where numbers “wrap around” after reaching a certain value, called the **modulus**.

- Example with small numbers:
  $$
  10 \mod 7 = 3
  $$
  Because $$ 10 = 7 \times 1 + 3 $$

### **Mod a Large Prime**

- In cryptography, the **modulus is a large prime number** $p$, often 256, 512, 1024, or 2048 bits.

- When we compute:
  $$
  x \mod p
  $$

  - The result is always between $0$ and $p-1$
  - Arithmetic **wraps around** this prime field

- **Why prime?**

  - Ensures the set $\{0, 1, 2, ..., p-1\}$ forms a **finite field GF(p)**
  - Every non-zero number has a **multiplicative inverse** (essential for Lagrange interpolation)

------

## 2️⃣ **Without Modular Reduction (Raw Integer Arithmetic)**

If we compute polynomials **without a modulus**, like:


$$
f(x) = a_0 + a_1x + a_2x^2
$$


Then:

1. **Shares grow in size** as $x$ increases
   - Example: $x^3$ grows fast for large x
2. **Interpolation in integers is possible with < k shares**
   - Standard polynomial interpolation (Lagrange) works in integers
   - Attacker can **predict missing coefficients** from partial data if secret or coefficients are small enough
3. **Information leakage**
   - High bits of shares can reveal bits of the secret
   - Example:
     - Secret = 42
     - Share at $x=1$ = 42 (leaks secret immediately!)

**Conclusion:**
 Raw integer SSS is **not information-theoretically secure**.

------

## 3️⃣ **Finite Field Arithmetic and GF(p)**

A **finite field** $GF(p)$ (Galois Field of prime order $p$) has:

1. **Elements:** $0, 1, 2, ..., p-1$
2. **Operations:**
   - Addition: $(a + b) \mod p$
   - Multiplication: $(a \times b) \mod p$
   - Inversion: $a^{-1} \mod p$ exists for all $a \neq 0$
3. **Key Property:**
   - Polynomial of degree $k-1$ is **uniquely defined by k points** in GF(p)
   - Fewer than k points → **infinitely many polynomials possible**, so **secret is information-theoretically hidden**

### **Polynomial in GF(p)**

Example Shamir polynomial:


$$
f(x) = a_0 + a_1 x + a_2 x^2 \mod p
$$



- $a_0 =$ secret
- $a_1, a_2 =$ random coefficients in $[0, p-1]$

**Share generation:**


$$
y_i = f(x_i) \mod p
$$



# **Understanding GF(p): Galois Field of Prime Order**

## **What is GF(p)?**

- **GF(p)** stands for **Galois Field with p elements**, where **p is a prime number**.
- It is a **set of numbers** where we do **addition, subtraction, multiplication, and division** **mod p**.

Think of GF(p) as:


$$
GF(p) = \{ 0, 1, 2, ..., p-1 \}
$$


All calculations **wrap around p**.

------

### **Example 1: GF(5)**


$$
GF(5) = \{ 0, 1, 2, 3, 4 \}
$$



- **Addition mod 5**

  

  $$
  3 + 4 = 7 \mod 5 = 2
  $$

- **Multiplication mod 5**

  

  $$
  2 \times 4 = 8 \mod 5 = 3
  $$

- **Subtraction mod 5**

  

  $$
  1 - 4 = -3 \mod 5 = 2
  $$

  

- **Division mod 5 (using multiplicative inverse)**

  - $2^{-1} \mod 5 = 3$ because $2 \times 3 = 6 \mod 5 = 1$
  - $4 / 2 \mod 5 = 4 \times 2^{-1} = 4 \times 3 = 12 \mod 5 = 2$

✅ **Observation**: Every non-zero number has a multiplicative inverse.

------

### **Example 2: GF(7)**



$$
GF(7) = \{ 0, 1, 2, 3, 4, 5, 6 \}
$$



- **Addition table (mod 7)**:

| +    | 0    | 1    | 2    | 3    | 4    | 5    | 6    |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| 0    | 0    | 1    | 2    | 3    | 4    | 5    | 6    |
| 1    | 1    | 2    | 3    | 4    | 5    | 6    | 0    |
| 2    | 2    | 3    | 4    | 5    | 6    | 0    | 1    |
| …    | …    | …    | …    | …    | …    | …    | …    |



- Notice how numbers **wrap around** after 7.

------

### ✅ **Why GF(p) is Important in Cryptography**

1. **Closure and predictability**
   - No overflow issues, numbers stay in $0..p-1$
2. **Multiplicative inverse exists for every non-zero element**
   - Makes **division** well-defined
3. **Supports polynomial arithmetic in a finite field**
   - Essential for **Shamir’s Secret Sharing** and **elliptic curve cryptography**
4. **Information-theoretic security**
   - Without enough shares, the secret can be **any value in GF(p)**

------

## **Illustrating GF(p) on a Circle**

One way to visualize GF(p) is a **modular clock**:

- **GF(5)** looks like a clock with 5 hours: 0 → 1 → 2 → 3 → 4 → 0
- **Addition moves clockwise**
- **Multiplication is like repeated jumps**

------

## **How GF(p) Is Used in Shamir’s Secret Sharing**

1. Choose a **prime p > secret**

2. Construct a **random polynomial in GF(p)**:

   

   $$
   f(x) = a_0 + a_1x + a_2x^2 \mod p
   $$

   

   - $a_0 = $ secret
   - $a_1, a_2 = $ random numbers in GF(p)

3. Generate shares as points:

   

   $$
   (x, f(x) \mod p)
   $$

   

4. Reconstruct secret using **Lagrange interpolation in GF(p)**



##### Example of GF(7)

![](./images/Finite_GF7.png)

##### Example GF(5)

![Finite_GF7](./images/Finite_GF5.png)

------

## 4️⃣ **Why Lagrange Interpolation in GF(p) Is Secure**

### **Lagrange Interpolation Formula**

Given k shares $(x_i, y_i)$, the secret $a_0$ can be reconstructed as:


$$
f(0) = \sum_{i=1}^{k} y_i \cdot \lambda_i \mod p
$$


Where:


$$
\lambda_i = \prod_{j=1, j \neq i}^{k} \frac{x_j}{x_j - x_i} \mod p
$$



- Each fraction is **modular inverse** (exists only in prime fields)
- Requires **exactly k shares** to get the secret

------

### **Why Fewer than k Shares Reveal Nothing**

1. In GF(p), **random coefficients are uniform modulo p**
2. With $k-1$ or fewer shares:
   - Infinite number of polynomials can pass through the given points
   - Secret (the value at $x=0$) could be **any value in GF(p)**
   - Attackers gain **0 bits of information** about the secret
3. This is the essence of **Information-Theoretic Security**

------

## 5️⃣ **Polynomial Interpolation Leakage Without Mod Prime**

If you **don’t use mod p**:

1. Interpolation happens in **ℤ (integers)**:
   - Unique polynomial passes through any k points
   - Even **k-1 points can reveal partial structure**
2. Example:
   - Secret = 123
   - Polynomial: $f(x) = 123 + 45x + 67x^2$
   - Share at x=1 = 235 → already hints secret < 235
3. Attackers can:
   - Solve for coefficients with less than k shares if the space is small
   - Use **lattice attacks** for large integers

------

## 6️⃣ **Why Large Prime Size Matters in SSS**

- **Prime size ≥ secret size** ensures secret fits in field
- **Bigger primes = bigger security**
  - 256-bit → suitable for modern cryptography (AES-256 level)
  - 512/1024/2048-bit → used in academic learning or for very high entropy secrets
- **Security relies on**:
  1. Random coefficients in GF(p)
  2. Mod p arithmetic ensures **wraparound hides polynomial structure**
  3. Fewer than k shares → **completely random secret in GF(p)**

------

## What If your **secret is smaller than the key size (prime field size)** in **Shamir’s Secret Sharing (SSS)**, here is the **impact and considerations**:

------

### 1️⃣ **Security Perspective**

- **Key size (prime p)** determines the **finite field GF(p)**.

- Secret $S$ must satisfy:

  

$$
0 \leq S < p
$$



- If your secret is **smaller than p**, there is **no direct functional problem**, because SSS only requires the secret to be within the field.

#### ✅ Security Note:

- An **attacker sees the shares** as random points in GF(p).
- As long as **p is large enough**, the **entropy** comes from the **field size**, not just the secret length.
- If the secret is much smaller than p, **entropy is effectively lower** than the maximum provided by GF(p).

------

### 2️⃣ **Example**

- Suppose **key size = 1024 bits**
   → $p \approx 2^{1024}$
- Your secret is a **16-bit number (0–65535)**

**What happens:**

1. Polynomial is generated modulo $p$ (a 1024-bit prime).
2. Shares are huge (~1024 bits), **but actual secret entropy is only 16 bits**.
3. **Brute force possible** if the adversary guesses small secrets.

------

### 3️⃣ **Impact Summary**

| Scenario                                   | Impact                                                  |
| ------------------------------------------ | ------------------------------------------------------- |
| Secret smaller but random                  | Works, but entropy limited to secret size               |
| Secret smaller and predictable (e.g., PIN) | Easily brute-forced if k is small                       |
| Secret << p                                | Large shares, but security only as strong as the secret |



------

### 4️⃣ **Best Practices**

1. **Pad the secret** to match the key size
   - Example: Append random bytes before applying SSS.
2. **Hash the secret first**
   - Convert a small secret to a fixed-length digest (256–512 bits) to improve entropy.
3. **Choose p appropriately**
   - It must be **> secret**, but don’t unnecessarily choose extremely large p if the secret is tiny.

------

### 5️⃣ **Illustration**

- Secret: `42` (small)
- Field: $GF(2^{1024})$
- Shares: huge 1024-bit numbers
- Security:
  - Without random padding, attacker can **try all 0–65535** secrets easily.

## 🔗 GitHub Project: Shamir's Secret Share Implementation

If you want to **experiment with Shamir’s Secret Sharing (SSS) in Java**,  
I have published a **working project** here:

[![GitHub Repo](https://img.shields.io/badge/GitHub-KathiravanMuthaiah%2Fshamir--file--splitter-181717?logo=github)](https://github.com/KathiravanMuthaiah/shamir-file-splitter)


*Project by Kathiravan Muthaiah | Open-source for learning and security experimentation*

# Wish you all success

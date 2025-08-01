# 📘 Polynomial and Lagrange Interpolation — Foundations for Shamir’s Secret Sharing

------

## 🎯 Learning Outcomes

By the end of this, you'll understand:

1. What a polynomial is
2. What a degree of a polynomial means
3. Why polynomials are used in Shamir's Secret Sharing
4. How Lagrange Interpolation works and why it's key to reconstructing secrets
5. How it all connects in a secure, lossless cryptographic scheme

------

## 1️⃣ What is a Polynomial?

A **polynomial** is a mathematical expression involving a sum of powers of $x$ multiplied by coefficients.

### General form:

$$
f(x) = a_0 + a_1x + a_2x^2 + a_3x^3 + \dots + a_nx^n
$$

- $a_0, a_1, ..., a_n$ are constants called **coefficients**
- $x$ is the variable
- The **degree** of the polynomial is the highest power of $x$ with a non-zero coefficient

### 📌 Examples:

- $f(x) = 5x^3 + 2x + 1$ is a **3rd-degree polynomial**
- $f(x) = 7x + 4$ is a **1st-degree polynomial**
- $f(x) = 10$ is a **0th-degree polynomial** (a constant)

------

## 2️⃣ What is an n-degree Polynomial?

An **n-degree polynomial** is a polynomial where the highest exponent of $x$ is $n$.

### Why does this matter?

- You need $n + 1$ unique points to fully determine an n-degree polynomial.
- Example:
  - A **1st-degree (linear)** polynomial: needs 2 points
  - A **2nd-degree (quadratic)** polynomial: needs 3 points

------

## 3️⃣ Why Use Polynomials in Shamir's Secret Sharing?

### Problem:

You want to split a secret $s$ into parts and only allow recovery if **at least $k$** out of **$n$** parts are combined.

### Solution:

Use a **(k - 1)-degree polynomial**:
$$
f(x) = s + a_1x + a_2x^2 + \dots + a_{k-1}x^{k-1}
$$

- $s$ is the **secret** = constant term $a_0$
- $a_1, ..., a_{k-1}$ are random values
- Each **share** is a point $(x_i, f(x_i))$
- Only with **k** points can you **reconstruct** the original polynomial and extract the secret $f(0) = s$

------

## 4️⃣ What is Lagrange Interpolation?

### Goal:

Given $k$ points $(x_1, y_1), (x_2, y_2), ..., (x_k, y_k)$, find a polynomial $f(x)$ of degree ≤ $k - 1$ that passes through all points.

### The Formula:

$$
f(x) = \sum_{j=1}^{k} y_j \cdot L_j(x)
$$

Where each **Lagrange basis polynomial** $L_j(x)$ is:
$$
L_j(x) = \prod_{\substack{1 \le m \le k \\ m \ne j}} \frac{x - x_m}{x_j - x_m}
$$

------

### To Find the Secret:

Set $x = 0$, so:
$$
s = f(0) = \sum_{j=1}^{k} y_j \cdot L_j(0)
$$
Each $L_j(0)$ is computed based on the known $x$-values of shares.

------

### 💡 Step-by-Step Intuition (With 3 Shares)

Let's say you have 3 shares:

- $(1, 207)$
- $(2, 305)$
- $(3, 445)$

You know they lie on a quadratic curve:
$$
f(x) = a_0 + a_1x + a_2x^2
$$
Your goal: use Lagrange interpolation to find $f(0) = a_0 = \text{secret}$

------

### 🔢 Lagrange Interpolation Demo (Simplified)

#### Suppose:

$$
f(x) = a_0 + a_1x + a_2x^2
$$

And we know 3 points: $(x_1, y_1), (x_2, y_2), (x_3, y_3)$

We construct:
$$
L_1(0) = \frac{(0 - x_2)(0 - x_3)}{(x_1 - x_2)(x_1 - x_3)}
$$
Then:
$$
f(0) = y_1 \cdot L_1(0) + y_2 \cdot L_2(0) + y_3 \cdot L_3(0)
$$
This gives us the secret!

------

## 📊 Visual Explanation: f(0) and the Curve



- Red Dots = Shares (known points)
- Blue Curve = Polynomial $f(x)$
- Green Line at $x=0$: Marks the vertical where the secret lies
- Purple Dot = $f(0) = s$: The y-intercept (the secret)

You can reconstruct this entire blue curve using **just the red dots** (if ≥ $k$), and evaluate at $x = 0$ to find the secret.



# **Lagrange Interpolation – Simple Explanation**

### **1️⃣ What is Lagrange Interpolation?**

- Imagine a **curve** (a polynomial) drawn on a graph.
- If you **know a few points** on that curve, you can **recreate the entire curve**.
- Once you have the polynomial equation of that curve, you can **calculate the value at any x**.

**In Shamir’s Secret Sharing:**

- The **secret** is the **y-value of the polynomial when x = 0** (the intercept).
- We **generate random points** `(x1, y1), (x2, y2)...` on the polynomial.
- With **at least k points**, we can **reconstruct the polynomial** and find `f(0)` → the secret.

------

### **2️⃣ Intuitive Analogy**

Think of a **polynomial curve** as a **smooth slide in a playground**:

- We **don’t see the entire slide**, but we can **stand at some points** on the slide.
- If we **stand at enough points**, we can imagine and **draw the slide’s curve**.
- After drawing the slide completely, we can **predict the slide’s height** at the **starting point (x=0)**.

In math:

- **Polynomial = Slide**
- **Known Points = Our positions on the slide**
- **Lagrange interpolation = Drawing the slide perfectly from our positions**

------

### **3️⃣ Why It Works for Polynomials**

A **polynomial of degree k-1** is fully determined by **k points** (as long as all x-values are unique):

- Line (degree 1) → Needs **2 points** to define it.
- Parabola (degree 2) → Needs **3 points** to define it.
- Cubic curve (degree 3) → Needs **4 points**, and so on…

**Shamir’s Secret Sharing rule:**

- If you want **k-of-n reconstruction**, use a **(k-1)-degree polynomial**.
- That’s why **k points are enough** to reconstruct the secret.

------

### **4️⃣ Lagrange Formula – Step by Step**

Suppose we have `k` points:

```structured text
(x1, y1), (x2, y2), …, (xk, yk)
```

We want to **reconstruct f(0)** (the secret).

The Lagrange interpolation formula is:
$$
f(0) = \sum_{i=1}^{k} \Big[ y_i * L_i(0) \Big]
$$
Where:
$$
L_i(0) = \prod_{j=1, j≠i}^{k} \frac{0 - x_j}{x_i - x_j}
$$
Let’s break it down in **plain English**:

1. **Pick one known point (xi, yi).**
2. **Build a weight (Li) that “activates” this point** and “turns off” all others at x=0.
   - Numerator: `(0 - xj)` → How far is 0 from the other points
   - Denominator: `(xi - xj)` → Distance between the current x and the other x’s
3. **Multiply yi by its weight Li(0)**.
4. **Do this for all k points and sum them up** → You get the original secret.

------

### **5️⃣ Mini Example with Numbers**

#### **Polynomial straight line (k=2)**

Let’s take a **2-of-3 Shamir scheme** (k=2 → polynomial degree 1 → straight line).

We share a secret `S = 5` using prime 17.

1. **Polynomial:**

   ```structured text
   f(x) = 5 + 3x   (random slope = 3)
   ```

2. **Generate 3 shares:**

   ```structured text
   x=1 → y=8
   x=2 → y=11
   x=3 → y=14
   ```

We only have **two shares** for reconstruction:

```structured text
(1,8) and (2,11)
```

------

**Step 1: Compute Lagrange weights for x=0**

- For point 1 (x1=1):

$$
L1(0) = \frac{0-2}{1-2} = \frac{-2}{-1} = 2
$$

- For point 2 (x2=2):

$$
L2(0) = \frac{0-1}{2-1} = \frac{-1}{1} = -1
$$

------

**Step 2: Reconstruct Secret**
$$
f(0) = y1 * L1 + y2 * L2
$$
✅ Recovered secret = **5**



#### **Quadratic Polynomial (k=3)**

We now want **3-of-n Shamir Secret Sharing**, which uses a **quadratic polynomial**:
$$
f(x) = 12 + 4x + 5x^2
$$

- **Secret** = `f(0)` = **12**
- **Prime** = 31 (small prime for example)

------

### **Generate Shares**

Compute `f(x)` for different x values:

| x    | f(x) = 12 + 4x + 5x² | f(x) mod 31 |
| ---- | -------------------- | ----------- |
| 1    | 12 + 4 + 5  = 21     | 21          |
| 2    | 12 + 8 + 20 = 40     | 9           |
| 3    | 12 + 12 + 45 = 69    | 7           |
| 4    | 12 + 16 + 80 = 108   | 15          |



So, **shares** are:

```structured text
(1,21), (2,9), (3,7), (4,15)
```

We only need **k=3 points** to reconstruct the secret.

------

### **Lagrange Interpolation for x=0**

We take 3 shares: `(1,21)`, `(2,9)`, `(3,7)`
 We want **f(0) = Secret**.

The formula for Lagrange is:
$$
f(0) = y1*L1(0) + y2*L2(0) + y3*L3(0) \mod 31
$$
Where:
$$
L_i(0) = \prod_{j=1,j≠i}^{3} \frac{0 - x_j}{x_i - x_j}
$$

------

#### **Step 1: Compute L1(0) for x1=1**

$$
L1(0) = \frac{0-2}{1-2} * \frac{0-3}{1-3}
$$

In modulo 31 (using modular inverse for fractions):

-2 mod 31 = 29
 -1 mod 31 = 30
 Inverse of 30 mod 31 = 30 (since 30*30=900 ≡ 1 mod 31)
 Inverse of 29 mod 31 = 15 (since 29*15=435 ≡ 1 mod 31)

```structured text
L1(0) = 29*30 * 28*16 mod 31 → simplified result = 3
```

*(We can simplify but for GitHub we can keep step result only)*

------

#### **Step 2: Compute L2(0) for x2=2**

$$
L2(0) = \frac{0-1}{2-1} * \frac{0-3}{2-3}
$$

------

#### **Step 3: Compute L3(0) for x3=3**

$$
L3(0) = \frac{0-1}{3-1} * \frac{0-2}{3-2}
$$

------

#### **Step 4: Compute Secret**

$$
f(0) = 21*3 + 9*3 + 7*1
$$

✅ Reconstructed secret = **12**

------

### **Why This is Powerful**

- A **quadratic polynomial** allows a **3-of-n** scheme.
- Any 3 shares can reconstruct the **secret (12)**.
- **Any 2 shares are useless** because infinite parabolas can pass through 2 points.

------

### **6️⃣ How Modular Arithmetic Fits In**

- In Shamir’s Secret Sharing, we **work modulo a prime** to:
  - Avoid fractions → we use **modular inverse** instead.
  - Ensure all calculations stay in a finite number system.
  - Provide cryptographic safety.

So in actual code:

- Subtraction → `(a-b+prime) % prime`
- Division → multiply by **modular inverse** instead of `/`

------

### **7️⃣ Why Lagrange Interpolation is Perfect for SSS**

1. **Guarantee:** Any `k` points can recover the secret.
2. **Security:** Fewer than `k` points reveal **nothing** because there are **infinite possible polynomials** passing through fewer points.
3. **Deterministic:** Given the same k shares, reconstruction is always the same.

------

## 🧠 Why is This Secure?

- A $(k - 1)$-degree polynomial is **underdetermined** with fewer than $k$ points.
- Example: With 2 points, infinitely many 2nd-degree curves could fit — no way to guess the real one.

This gives Shamir’s scheme **information-theoretic security** — even with **infinite computing power**, you cannot recover the secret without $k$ shares.

------

## ✅ Summary

| Concept                | Meaning                                                      |
| ---------------------- | ------------------------------------------------------------ |
| Polynomial             | Equation of multiple terms, each with powers of x            |
| Degree of polynomial   | Highest power of x                                           |
| Secret as constant     | In SSS, secret is the constant term $a_0$                    |
| Lagrange Interpolation | Way to reconstruct a polynomial from known points            |
| $f(0) = s$             | The secret is recovered by evaluating the polynomial at $x = 0$ |

## Shamir's Secret Sharing - Polynomial and Lagrange Interpolation



![output](./images/output.png)

## 📉 Graph Explanation

The plotted graph above shows:

- The polynomial $f(x) = 20x^2 + 50x + 123$
- Red dots: 3 shares (points on the curve)
- Purple dot: $f(0) = 123$, the original secret
- Green dashed line: $x = 0$, vertical axis
- Blue curve: Full polynomial determined from any 3 of those red dots

Even though we don’t know the full curve, **any 3 valid shares** (on the red points) allow you to reconstruct the entire blue curve, and thereby compute $f(0)$.

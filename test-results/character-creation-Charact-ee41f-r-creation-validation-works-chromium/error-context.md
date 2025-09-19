# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - img [ref=e8] [cursor=pointer]
  - alert [ref=e11]
  - generic [ref=e13]:
    - generic [ref=e14]:
      - generic [ref=e15]:
        - heading "Enter the Realm" [level=2] [ref=e16]
        - paragraph [ref=e17]: Welcome back, noble hero!
      - generic [ref=e18]:
        - generic [ref=e19]:
          - generic [ref=e20]: Email Address
          - textbox "Email Address" [ref=e21]
        - generic [ref=e22]:
          - generic [ref=e23]: Password
          - textbox "Password" [ref=e24]
        - button "🏰 Enter Realm" [ref=e25]
    - generic [ref=e26]:
      - paragraph [ref=e27]:
        - text: Don't have an account yet?
        - link "Join a Guild" [ref=e28] [cursor=pointer]:
          - /url: /auth/register
      - paragraph [ref=e29]:
        - text: Want to start your own family guild?
        - link "Found New Guild" [ref=e30] [cursor=pointer]:
          - /url: /auth/create-family
```
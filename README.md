# Utilities meters

# Electricity API call

```
curl -X POST \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/sshmyg/utilities-meters/actions/workflows/submit-electricity.yml/dispatches \
  -d '{"ref":"main","inputs":{"value":"12345"}}'
```

# Gas API call

```
curl -X POST \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/sshmyg/utilities-meters/actions/workflows/submit-gas.yml/dispatches \
  -d '{"ref":"main","inputs":{"value":"6789"}}'
```

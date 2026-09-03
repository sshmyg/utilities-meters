# Changelog

## 1.1.2

- Added an add-on icon (`icon.png`, 128x128).

## 1.1.1

- Fixed the Docker build failing on rebuild (`Cannot verify the identity of the @pnpm/exe.linux-arm64 native binary`) by pinning the pnpm version installed in the `Dockerfile` to `10.33.2`, matching the version already declared in `package.json` (`packageManager`). The previous unpinned `npm install -g pnpm` picked up a newer pnpm release that added a native-binary integrity check not satisfied by the existing lockfile.

## 1.1.0

- Fixed gas meter reading submission, which had stopped working after the utility provider (odgaz.odessa.ua) migrated the gas meter page to a single-page app and started requiring Google reCAPTCHA v3 on both the address-check and submit requests.
  - Replaced the old session/CSRF handling (scraping a `<meta name="csrf-token">` tag that no longer exists on the page) with the Laravel Sanctum flow: fetching `/sanctum/csrf-cookie` and sending the `XSRF-TOKEN` cookie value back as the `X-XSRF-TOKEN` header.
  - Switched the gas meter API calls to the current `/api/v1/gas-meter/check` and `/api/v1/gas-meter/submit` endpoints.
  - Added reCAPTCHA v3 token solving via the CapSolver API (new `gas_captcha_api_key` add-on option / `GAS_CAPTCHA_API_KEY` environment variable) so a valid `recaptcha_token` is generated and included on both the check and submit requests.
  - Errors returned by CapSolver now include the provider's error code in the thrown error message, so failures (e.g. an empty CapSolver balance) are clearly identifiable in the add-on log.
- Electricity meter submission (dtek-oem.com.ua) is unaffected — its flow was not changed.

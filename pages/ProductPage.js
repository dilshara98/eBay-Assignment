const { expect } = require('@playwright/test');

class ProductPage {
    constructor(page) {
        this.page = page;
        this.popupConfirmBtn = page.locator('button:has-text("Confirm")');
        this.searchBar = page.locator('#gh-ac');
        this.firstProductLink = page.locator("(//a[@class='s-card__link image-treatment'])[5]");
        this.relatedSection = page.locator('//h2[contains(text(), "Similar items")]/ancestor::section[1]');
        this.productCards = this.relatedSection.locator('//descendant-or-self::section');
        this.productPrices = this.productCards.locator('//span[contains(text(),"$")]');
        this.productTitles = this.productCards.locator('//descendant-or-self::h3');

    }

    async navigateAndClearPopup() {
        await this.page.goto('https://www.ebay.com', { waitUntil: 'domcontentloaded', timeout: 60000 });
        try {
            if (await this.popupConfirmBtn.isVisible({ timeout: 5000 })) {
                await this.popupConfirmBtn.click();
            }
        } catch (e) {
            console.log("Shipping popup did not appear.");
        }
    }

    async searchAndSelectProduct(term) {
        await this.searchBar.fill(term);
        await this.searchBar.press('Enter');
        await this.firstProductLink.waitFor({ state: 'visible', timeout: 30000 });
        await this.firstProductLink.click();
    }

    async loadRelatedSection() {
        for (let i = 0; i < 8; i++) {
            await this.page.mouse.wheel(0, 600);
            await this.page.waitForTimeout(500);
        }

        await this.relatedSection.waitFor({ state: 'visible', timeout: 30000 });
    }

    async getRelatedProductCount() {
        await this.productCards.first().waitFor({ state: 'visible', timeout: 30000 });
        return await this.productCards.count();
    }

    async getMainProductPrice() {
        const priceElement = this.page.locator('.x-price-primary, #prcIsum');
        await priceElement.waitFor({ state: 'visible' });

        const priceText = await priceElement.innerText();
        return parseFloat(priceText.replace(/[^0-9.]/g, ''));
    }
}

module.exports = { ProductPage };
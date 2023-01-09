interface SubscriptionDetails {
    id: number;
    callback: Function;
    subscribeOnce: boolean;
}

interface PubsubStore {
    [topic: string]: SubscriptionDetails[]
}

export class PubSub {

    public subscriptionsCounter: number = 0;

    public pubsubStore: PubsubStore = {};

    subscribe(topic: string, fn: Function, subscribeOnce: boolean = false): number {
        if (!(topic in this.pubsubStore)) { this.pubsubStore[topic] = []; }
        const id = ++this.subscriptionsCounter;
        this.pubsubStore[topic].push({
            id,
            callback: fn,
            subscribeOnce
        });
        return id;
    }

    unsubscribe(topic: string, unsubscribeId: number): void {
        const subscriptionsFiltered: SubscriptionDetails[] = (this.pubsubStore[topic] ?? []).filter( (item) => item.id !== unsubscribeId);
        this.pubsubStore[topic] = [...subscriptionsFiltered];
        if (!subscriptionsFiltered.length) {
            delete this.pubsubStore[topic];
        }
    }

    publish<T>(topic: string, data: T): void {
        Object.values(this.pubsubStore[topic]).forEach( (subscription) => {
            if (subscription.subscribeOnce) {
                subscription.callback(data);
                this.unsubscribe(topic, subscription.id);
            } else {
                subscription.callback(data);
            }
        })
    }
}
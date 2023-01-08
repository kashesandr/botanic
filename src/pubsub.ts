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

    unsubscribe(topic: string, id: number): void {
        this.pubsubStore[topic] = [...this.pubsubStore[topic]?.filter( item => item.id !== id) ?? []];
    }

    publish<T>(topic: string, data: T): void {
        for (let subscriber of this.pubsubStore[topic]) {
            if (subscriber.subscribeOnce) {
                subscriber.callback(data);
                this.unsubscribe(topic, subscriber.id);
            } else {
                subscriber.callback(data);
            }
        }
    }
}
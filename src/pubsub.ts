interface IdCallback {
    id: number;
    callback: Function;
    subscribeOnce: boolean;
}

interface PubsubStore {
    [topic: string]: IdCallback[]
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
        const subscribers: IdCallback[] = [];
        for (let subscriber of this.pubsubStore[topic]) {
            if (subscriber.id !== id) {
                subscribers.push(subscriber);
            }
        }
        this.pubsubStore[topic] = subscribers;
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